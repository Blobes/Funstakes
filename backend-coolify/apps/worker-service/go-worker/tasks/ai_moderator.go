package tasks

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"
)

type Moderator struct {
	apiKey         string
	apiURL         string
	primaryModels  []string
	fallbackModels []string
	systemText     string
}

type OpenRouterMessageContent struct {
	Type     string                `json:"type"`
	Text     string                `json:"text,omitempty"`
	ImageURL *OpenRouterMediaValue `json:"image_url,omitempty"`
	VideoURL *OpenRouterMediaValue `json:"video_url,omitempty"`
}

type OpenRouterMediaValue struct {
	URL string `json:"url"`
}

type OpenRouterMessage struct {
	Role    string      `json:"role"`
	Content interface{} `json:"content"`
}

type SchemaProperty struct {
	Type string   `json:"type"`
	Enum []string `json:"enum,omitempty"`
}

type SchemaArrayItems struct {
	Type string `json:"type"`
}

type SchemaArrayProperty struct {
	Type  string           `json:"type"`
	Items SchemaArrayItems `json:"items"`
}

type ResponseFormatSchemaDefinition struct {
	Type       string                 `json:"type"`
	Properties map[string]interface{} `json:"properties"`
	Required   []string               `json:"required"`
}

type ResponseFormatSchemaWrapper struct {
	Name   string                         `json:"name"`
	Strict bool                           `json:"strict"`
	Schema ResponseFormatSchemaDefinition `json:"schema"`
}

type OpenRouterResponseFormat struct {
	Type       string                       `json:"type"`
	JsonSchema *ResponseFormatSchemaWrapper `json:"json_schema,omitempty"`
}

type OpenRouterRequest struct {
	Models         []string                 `json:"models"`
	Messages       []OpenRouterMessage      `json:"messages"`
	Temperature    float32                  `json:"temperature"`
	MaxTokens      int32                    `json:"max_tokens"`
	Seed           int                      `json:"seed"`
	ResponseFormat OpenRouterResponseFormat `json:"response_format"`
}

/**
 * Returns the structural validation JSON schema format compliant with OpenRouter specification standards.
 */
func getModerationResponseSchema() *ResponseFormatSchemaWrapper {
	return &ResponseFormatSchemaWrapper{
		Name:   "content_moderation_response",
		Strict: true,
		Schema: ResponseFormatSchemaDefinition{
			Type: "object",
			Properties: map[string]interface{}{
				"isFlagged": SchemaProperty{
					Type: "boolean",
				},
				"ruleViolated": SchemaProperty{
					Type: "string",
				},
				"severity": SchemaProperty{
					Type: "string",
					Enum: []string{"CRITICAL", "MODERATE", "LOW", "NONE"},
				},
				"violationSource": SchemaProperty{
					Type: "string",
					Enum: []string{"TEXT", "MEDIA", "NONE"},
				},
				"reason": SchemaProperty{
					Type: "string",
				},
				"confidence": SchemaProperty{
					Type: "number",
				},
				"extractedKeywords": SchemaArrayProperty{
					Type: "array",
					Items: SchemaArrayItems{
						Type: "string",
					},
				},
			},
			Required: []string{"isFlagged", "reason", "ruleViolated", "severity", "violationSource", "confidence", "extractedKeywords"},
		},
	}
}

/**
 * Initializes a new instance of the OpenRouter moderation processor with active database topics awareness.
 */
func NewOpenRouterModerator(ctx context.Context, apiKey string, primaryModels []string, fallbackModels []string, existingDBTopics []string) (*Moderator, error) {
	textCriticalJSON, _ := json.Marshal(GlobalContentPolicy.Text.Rules[SeverityCritical])
	textModerateJSON, _ := json.Marshal(GlobalContentPolicy.Text.Rules[SeverityModerate])
	textLowJSON, _ := json.Marshal(GlobalContentPolicy.Text.Rules[SeverityLow])

	mediaCriticalJSON, _ := json.Marshal(GlobalContentPolicy.Media.Rules[SeverityCritical])
	mediaModerateJSON, _ := json.Marshal(GlobalContentPolicy.Media.Rules[SeverityModerate])
	mediaLowJSON, _ := json.Marshal(GlobalContentPolicy.Media.Rules[SeverityLow])

	existingTopicsFormatted := "NONE (Database has no active topics yet)"
	if len(existingDBTopics) > 0 {
		existingTopicsFormatted = strings.Join(existingDBTopics, ", ")
	}

	systemInstructionText := fmt.Sprintf(`
		Role: Senior Content Safety & Taxonomy Discovery Engine.

		OUTPUT FORMAT RULES:
		- You must output exactly and ONLY a valid JSON object matching the requested schema.
		- Do NOT include conversational text prefixes or suffixes.

		EXISTING SYSTEM TOPICS IN DATABASE:
		[%s]

		CORE OPERATION MODES (Look at the "Mode:" variable passed in the prompt):
		1. EXTRACT_KEYWORDS_ONLY: You must completely bypass safety policy evaluation. Do NOT look for rules violations. Set isFlagged to false, severity to "NONE", ruleViolated to "", and violationSource to "NONE". Your sole job is to process the fields to populate extractedKeywords.
		2. THUMBNAIL_PRE_SCREEN: Evaluate incoming media assets strictly against CRITICAL MEDIA RULES. Bypass MODERATE and LOW rules entirely for this mode.
		3. FULL_ASSESSMENT / MODERATE_ONLY / MODERATE_AND_EXTRACT_KEYWORDS: Perform full double-track enforcement evaluations.

		CORE EVALUATION PRINCIPLES:
		- TEXT EVALUATION (INTENT & CONTEXT-FOCUSED): Evaluate the holistic meaning, tone, and contextual intent of text strings. Do NOT perform simple keyword matching. Benign discussion or meta-commentary about safety systems must NOT be flagged.
		- MEDIA EVALUATION (STRICT RULE-BASED): Evaluate visual media content strictly based on explicit objects, actions, and depictions. If the media contains graphic elements matching the rules, flag it immediately regardless of intent.

		TEXT COMPLIANCE POLICY HIERARCHY:
		- CRITICAL TEXT RULES: %s
		- MODERATE TEXT RULES: %s
		- LOW TEXT RULES: %s

		VISUAL MEDIA COMPLIANCE POLICY HIERARCHY:
		- CRITICAL MEDIA RULES: %s
		- MODERATE MEDIA RULES: %s
		- LOW MEDIA RULES: %s

		TAXONOMY EXTRACTION RULES (extractedKeywords):
		- If the operational mode requests keyword extraction (EXTRACT_KEYWORDS_ONLY or MODERATE_AND_EXTRACT_KEYWORDS), analyze the post payload caption and media assets to extract up to 3 relevant thematic topics.
		- STRICT TOPIC SELECTION HIERARCHY:
		  1. FIRST, check the "EXISTING SYSTEM TOPICS IN DATABASE" list provided above. If the post content matches or closely relates to any of those existing topics, YOU MUST PICK AND USE THOSE EXACT TOPIC NAMES IN THE DB.
		  2. ONLY if the topics perceived in the post are SIGNIFICANTLY DIFFERENT from every topic listed in the database are you permitted to generate entirely new topic names.
		- Ensure all extracted topics are distinct, descriptive and not more than two (2) words.
		- If the mode is MODERATE_ONLY, do NOT extract new topics; leave the extractedKeywords array completely empty.
		`,
		existingTopicsFormatted,
		textCriticalJSON, textModerateJSON, textLowJSON,
		mediaCriticalJSON, mediaModerateJSON, mediaLowJSON,
	)

	return &Moderator{
		apiKey:         apiKey,
		apiURL:         "https://openrouter.ai/api/v1/chat/completions",
		primaryModels:  primaryModels,
		fallbackModels: fallbackModels,
		systemText:     systemInstructionText,
	}, nil
}

/**
 * Closes connections gracefully.
 */
func (gm *Moderator) Close() {}

/**
 * Evaluates full post content packages using OpenRouter's multimodal routing pipelines.
 * Rotates through models in sequential chunks of 3 if primary routing paths fail.
 */
func (gm *Moderator) AIContentModerator(ctx context.Context, payload *PostModData, mediaTarget []MediaInput, mode string) (ValidationResult, error) {
	if len(gm.primaryModels) == 0 {
		return ValidationResult{}, fmt.Errorf("no primary operational models supplied to infrastructure config")
	}

	allModels := append([]string{}, gm.primaryModels...)
	allModels = append(allModels, gm.fallbackModels...)

	loopCtx, cancel := context.WithTimeout(ctx, 60*time.Second)
	defer cancel()

	var lastErr error
	var apiResponse map[string]interface{}
	requestSuccessful := false
	const maxChunkSize = 3

	client := &http.Client{Timeout: 25 * time.Second}

	for i := 0; i < len(allModels); i += maxChunkSize {
		if loopCtx.Err() != nil {
			lastErr = fmt.Errorf("overall moderation lifecycle deadline exceeded: %w", loopCtx.Err())
			break
		}

		end := i + maxChunkSize
		if end > len(allModels) {
			end = len(allModels)
		}
		currentModelChunk := allModels[i:end]

		var contents []OpenRouterMessageContent
		contents = append(contents, OpenRouterMessageContent{
			Type: "text",
			Text: fmt.Sprintf("Mode: %s", mode),
		})

		if payload.Caption != "" {
			contents = append(contents, OpenRouterMessageContent{
				Type: "text",
				Text: fmt.Sprintf("Caption: %s", payload.Caption),
			})
		}

		if len(payload.Topics) > 0 {
			contents = append(contents, OpenRouterMessageContent{
				Type: "text",
				Text: fmt.Sprintf("UserKeywords: %s", strings.Join(payload.Topics, ", ")),
			})
		}

		for _, m := range mediaTarget {
			var targetURL string
			if m.Type == "VIDEO" && m.ThumbnailURL != nil && *m.ThumbnailURL != "" && mode == "THUMBNAIL_PRE_SCREEN" {
				targetURL = *m.ThumbnailURL
			} else {
				targetURL = m.URL
			}

			contents = append(contents, OpenRouterMessageContent{
				Type:     "image_url",
				ImageURL: &OpenRouterMediaValue{URL: targetURL},
			})
		}

		messages := []OpenRouterMessage{
			{
				Role:    "system",
				Content: gm.systemText,
			},
			{
				Role:    "user",
				Content: contents,
			},
		}

		requestPayload := OpenRouterRequest{
			Models:      currentModelChunk,
			Messages:    messages,
			Temperature: 0.0,
			MaxTokens:   1000,
			Seed:        42,
			ResponseFormat: OpenRouterResponseFormat{
				Type:       "json_schema",
				JsonSchema: getModerationResponseSchema(),
			},
		}

		bodyBytes, err := json.Marshal(requestPayload)
		if err != nil {
			return ValidationResult{}, fmt.Errorf("failed marshaling openrouter request data: %w", err)
		}

		req, err := http.NewRequestWithContext(loopCtx, "POST", gm.apiURL, bytes.NewBuffer(bodyBytes))
		if err != nil {
			return ValidationResult{}, fmt.Errorf("failed constructing connection runtime request: %w", err)
		}

		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", gm.apiKey))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("HTTP-Referer", "https://funstakes.com")
		req.Header.Set("X-Title", "Funstakes Moderation Core Engine")
		req.Header.Set("X-Provider-Caching", "true")

		resp, err := client.Do(req)
		if err != nil {
			lastErr = fmt.Errorf("openrouter bridge request connection failed for chunk %v: %w", currentModelChunk, err)
			continue
		}

		err = func() error {
			defer resp.Body.Close()

			if resp.StatusCode != http.StatusOK {
				var errData map[string]interface{}
				_ = json.NewDecoder(resp.Body).Decode(&errData)
				return fmt.Errorf("openrouter infrastructure threw non-200 status code: %d, payload: %v, models tried: %v", resp.StatusCode, errData, currentModelChunk)
			}

			apiResponse = make(map[string]interface{})
			if decodeErr := json.NewDecoder(resp.Body).Decode(&apiResponse); decodeErr != nil {
				return fmt.Errorf("failed unpacking openrouter response payload buffer: %w", decodeErr)
			}

			return nil
		}()

		if err != nil {
			lastErr = err
			continue
		}

		requestSuccessful = true
		break
	}

	if !requestSuccessful {
		return ValidationResult{}, fmt.Errorf("all downstream openrouter model pipeline chunks exhausted completely without success. Last internal state error: %w", lastErr)
	}

	choices, ok := apiResponse["choices"].([]interface{})
	if !ok || len(choices) == 0 {
		return ValidationResult{}, fmt.Errorf("malformed choices signature array from aggregator engine response")
	}

	firstChoice := choices[0].(map[string]interface{})
	messageObj, ok := firstChoice["message"].(map[string]interface{})
	if !ok {
		return ValidationResult{}, fmt.Errorf("missing message component on selected payload block")
	}

	rawText, ok := messageObj["content"].(string)
	if !ok || rawText == "" {
		return ValidationResult{}, fmt.Errorf("empty text extraction layer on returned token frames")
	}

	var parsed AIResponseFormat
	if err := json.Unmarshal([]byte(strings.TrimSpace(rawText)), &parsed); err != nil {
		return ValidationResult{}, fmt.Errorf("failed parsing target response JSON validation schema contents: %w", err)
	}

	finalSeverity := parsed.Severity
	if finalSeverity == "" || finalSeverity == "NONE" {
		finalSeverity = string(SeverityNone)
	}

	finalSource := parsed.ViolationSource
	if finalSource == "" {
		finalSource = "NONE"
	}

	isUnsure := parsed.IsFlagged && parsed.Confidence < GlobalContentPolicy.Text.AIConfidenceLimit
	hasSensitiveGraphic := parsed.IsFlagged && Severity(finalSeverity) == SeverityLow && finalSource == "MEDIA"

	return ValidationResult{
		IsFlagged:           parsed.IsFlagged,
		HasSensitiveGraphic: hasSensitiveGraphic,
		IsUnsure:            isUnsure,
		RuleViolated:        parsed.RuleViolated,
		Severity:            Severity(finalSeverity),
		ViolationSource:     finalSource,
		Reason:              parsed.Reason,
		ExtractedTopics:     parsed.ExtractedKeywords,
	}, nil
}

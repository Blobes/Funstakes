package tasks

type Severity string
type PostStatus string
type ModerationTaskMode string
type UserTopicAddedBy string

const (
	TopicAddedBySystemAI   UserTopicAddedBy = "SYSTEM"
	TopicAddedByManualUser UserTopicAddedBy = "USER"
)

const (
	SeverityCritical Severity = "CRITICAL"
	SeverityModerate Severity = "MODERATE"
	SeverityLow      Severity = "LOW"
	SeverityNone     Severity = "NONE"
	SeverityUnknown  Severity = "UNKNOWN"
)

const (
	ModerateOnly               ModerationTaskMode = "MODERATE_ONLY"
	ModerateAndExtractKeywords ModerationTaskMode = "MODERATE_AND_EXTRACT_KEYWORDS"
	ExtractedKeywordsOnly      ModerationTaskMode = "EXTRACT_KEYWORDS_ONLY"
)

type TextPolicy struct {
	AIConfidenceLimit float64
	Rules             map[Severity][]string
}

type MediaPolicy struct {
	Rules map[Severity][]string
}

type ContentPolicy struct {
	Version string
	Text    TextPolicy
	Media   MediaPolicy
}

type DependencyContext struct {
	GeminiAPIKey     string
	OpenRouterAPIKey string
	PrimaryModels    []string
	FallbackModels   []string
	NodeClient       *NodeClient
	StorageClient    *StorageClient
}

type ModerationReport struct {
	Status              PostStatus       `json:"status"`
	Severity            Severity         `json:"severity"`
	RuleViolated        string           `json:"ruleViolated"`
	ExtractedTopics     []string         `json:"extractedTopics"`
	NewTopicsFromAi     []string         `json:"newTopicsFromAi,omitempty"`
	TopicsSource        UserTopicAddedBy `json:"topicsSource,omitempty"`
	Reason              string           `json:"reason"`
	NeedsReview         bool             `json:"needsReview"`
	HasSensitiveGraphic bool             `json:"hasSensitiveGraphic"`
}

type ValidationResult struct {
	IsFlagged           bool
	IsUnsure            bool
	RuleViolated        string
	Severity            Severity
	ViolationSource     string
	HasSensitiveGraphic bool
	Reason              string
	ExtractedTopics     []string
	WasSampled          bool
}

type AIResponseFormat struct {
	IsFlagged         bool     `json:"isFlagged"`
	RuleViolated      string   `json:"ruleViolated"`
	Severity          string   `json:"severity"`
	ViolationSource   string   `json:"violationSource"`
	Reason            string   `json:"reason"`
	Confidence        float64  `json:"confidence"`
	ExtractedKeywords []string `json:"extractedKeywords"`
}

const (
	StatusPublished    PostStatus = "PUBLISHED"
	StatusDeleted      PostStatus = "DELETED"
	StatusShadowbanned PostStatus = "SHADOWBANNED"
	StatusArchived     PostStatus = "ARCHIVED"
	StatusUnderReview  PostStatus = "UNDER_REVIEW"
	StatusBanned       PostStatus = "BANNED"
)

type BasePostMetadata struct {
	PostID   string       `json:"postId"`
	PostType string       `json:"postType"`
	UserID   string       `json:"userId"`
	Caption  string       `json:"caption"`
	Media    []MediaInput `json:"media,omitempty"`
}

type PostModData struct {
	BasePostMetadata
	Topics             []string           `json:"topics,omitempty"`
	TopicsSource       UserTopicAddedBy   `json:"topicsSource,omitempty"`
	ModerationTaskMode ModerationTaskMode `json:"moderationTaskMode"`
	Event              string             `json:"event"`
}

type MediaDimensions struct {
	Width       float64 `json:"width"`
	Height      float64 `json:"height"`
	AspectRatio float64 `json:"aspectRatio"`
}

type MediaInput struct {
	URL             string           `json:"url"`
	FileKey         string           `json:"fileKey"`
	Type            string           `json:"type"`
	ThumbnailURL    *string          `json:"thumbnailUrl,omitempty"`
	MimeType        *string          `json:"mimeType,omitempty"`
	Size            *int64           `json:"size,omitempty"`
	Dimensions      *MediaDimensions `json:"dimensions,omitempty"`
	BlurHash        *string          `json:"blurHash,omitempty"`
	StorageProvider string           `json:"storageProvider"`
}

type PostModCallbackPayload struct {
	BasePostMetadata
	ModResult ModerationReport `json:"modResult"`
	Event     string           `json:"event"`
}

type ProcessedMedia struct {
	MediaInput
	HLSUrl      *string  `json:"hlsUrl,omitempty"`
	VariantUrls []string `json:"variantUrls,omitempty"`
}

type ProcessMediaTaskPayload struct {
	TargetID       string       `json:"targetId"`
	Media          []MediaInput `json:"media"`
	PurgeRawSource bool         `json:"purgeRawSource,omitempty"`
}

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

type NodeClient struct {
	BaseURL    string
	HTTPClient *http.Client
}

type TopicsResponse struct {
	Success bool     `json:"success"`
	Topics  []string `json:"topics"`
}

/**
 * Builds a reusable HTTP client for internal callbacks.
 */
func NewNodeClient(baseURL string) *NodeClient {
	return &NodeClient{
		BaseURL: strings.TrimRight(baseURL, "/"),
		HTTPClient: &http.Client{
			Timeout: 15 * time.Second,
			Transport: &http.Transport{
				MaxIdleConns:        100,
				MaxIdleConnsPerHost: 20,
				IdleConnTimeout:     90 * time.Second,
			},
		},
	}
}

/**
 * Fetches existing topic names from the primary MongoDB collection via the Node backend service.
 */
func (nc *NodeClient) FetchDBTopics(ctx context.Context) ([]string, error) {
	targetEndpoint := fmt.Sprintf("%s/topics", nc.BaseURL)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, targetEndpoint, nil)
	if err != nil {
		return nil, fmt.Errorf("failed constructing fetch topics request: %w", err)
	}

	resp, err := nc.HTTPClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("network failure fetching DB topics: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("node engine returned non-200 status fetching topics: %d", resp.StatusCode)
	}

	var res TopicsResponse
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		return nil, fmt.Errorf("failed decoding topics payload: %w", err)
	}

	return res.Topics, nil
}

/**
 * Sends the final moderation payload to a specific routing path on the Node service.
 */
func (nc *NodeClient) DispatchFinalization(ctx context.Context, path string, payload *PostModCallbackPayload) error {
	callbackBytes, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal finalization payload: %w", err)
	}

	targetEndpoint := fmt.Sprintf("%s/%s", nc.BaseURL, strings.TrimLeft(path, "/"))

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, targetEndpoint, bytes.NewBuffer(callbackBytes))
	if err != nil {
		return fmt.Errorf("failed to construct HTTP request context: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := nc.HTTPClient.Do(req)
	if err != nil {
		return fmt.Errorf("network execution failure on finalization bridge callback: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("node engine transaction mutation state failed with response code: %d", resp.StatusCode)
	}

	return nil
}

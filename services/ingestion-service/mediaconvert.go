package main

import (
	"context"
	"log"

	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/mediaconvert"
)

// ResolveMediaConvertEndpoint fetches your account's regional private media routing path
func ResolveMediaConvertEndpoint(ctx context.Context) (string, error) {
	cfg, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		return "", err
	}

	// Create an initial regional client to discover the regional endpoint URL
	discoverClient := mediaconvert.NewFromConfig(cfg)
	
	out, err := discoverClient.DescribeEndpoints(ctx, &mediaconvert.DescribeEndpointsInput{})
	if err != nil {
		return "", err
	}

	if len(out.Endpoints) > 0 {
		log.Printf("Resolved MediaConvert Matrix Queue Target: %s", *out.Endpoints[0].Url)
		return *out.Endpoints[0].Url, nil
	}

	return "", nil
}

# LLM Integration Guide

This document provides an overview of Large Language Model (LLM) integration in the Planning Manager system.

## Overview

The Planning Manager uses LLMs to provide intelligent assistance throughout the project lifecycle. The integration is provider-agnostic, supporting multiple LLM vendors.

## Key Features

1. **Project Analysis and Enrichment** - Extract attributes from descriptions, suggest metadata, identify missing information
2. **Scoring and Evaluation** - Analyze projects against criteria, generate scoring justifications
3. **Report Generation** - Create customized reports with professional formatting
4. **Community Feedback Analysis** - Analyze public comments for sentiment and key concerns
5. **Project Assistant** - Answer contextual questions about projects

## Supported Providers

- **Anthropic**: Claude Sonnet 3.7
- **OpenAI**: GPT-4o, o1-pro, o3-mini, o3-mini-fast, and new models that are released
- **Groq**: Mixtral-8x7B, Llama-3-70B

## Configuration

LLM providers are configured in the environment variables:

- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `GROQ_API_KEY`

## Security and Compliance

- No user or project data is stored by external LLM providers
- All API communications use encrypted connections
- API keys are stored securely in environment variables
- User consent required before sending data to LLM services
- Options for local/private LLM deployments

For implementation details, refer to the code in `src/lib/llm/`.

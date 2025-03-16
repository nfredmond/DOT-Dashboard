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

## Database Schema

The database includes several tables specific to LLM functionality:

### Vector Extension

The database requires the `vector` extension for embedding storage:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### LLM Logs

Tracks all LLM interactions for auditing and cost analysis:

```sql
CREATE TABLE llm_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    request TEXT,
    response TEXT,
    tokens INTEGER,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Document Content Tables

These tables store document content with vector embeddings for semantic search:

```sql
-- Regular documents content
CREATE TABLE document_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    content TEXT,
    embedding vector(1536),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Construction document content
CREATE TABLE construction_document_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    construction_document_id UUID NOT NULL REFERENCES construction_documents(id) ON DELETE CASCADE,
    content TEXT,
    embedding vector(1536),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### LLM Indexing Flags

Documents tables have an `is_llm_indexed` flag to track which documents have been processed:

```sql
-- In the documents table
is_llm_indexed BOOLEAN DEFAULT FALSE

-- In the construction_documents table
is_llm_indexed BOOLEAN DEFAULT FALSE
```

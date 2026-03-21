# Acme Logistics — Inbound Carrier Sales Automation

AI-powered inbound carrier sales system for a freight brokerage. Carriers call in, get vetted via FMCSA, matched to available loads, negotiate pricing (up to 3 rounds), and get transferred to a sales rep upon agreement. A React dashboard displays call metrics in real time.

## Architecture

```
Carrier Call (HappyRobot Web Call)
        │
        ▼
  HappyRobot Voice Agent
        │
        ▼
  API Gateway (HTTPS + API key)
        │
        ▼
  AWS Lambda (FastAPI container)
   ├── POST /api/carrier/verify    → FMCSA MC# verification
   ├── POST /api/loads/search      → Search loads from S3
   ├── POST /api/negotiate         → Offer evaluation (max 3 rounds)
   ├── POST /api/calls/log         → Write call log to S3
   └── GET  /api/metrics           → Aggregate metrics from S3 call logs
        │
        └── S3 (loads.json + call logs)

  React Dashboard (S3 + CloudFront)
   └── Fetches from GET /api/metrics
```

## Tech Stack

- **Backend:** Python 3.11, FastAPI, Mangum (Lambda adapter)
- **Infrastructure:** AWS CDK (TypeScript) — Lambda, API Gateway, S3, CloudFront
- **Dashboard:** React (Vite + TypeScript), Recharts
- **Voice Agent:** HappyRobot platform
- **Container:** Docker (Lambda container image, built with Finch)

## Project Structure

```
├── app/
│   ├── main.py              # FastAPI app + Mangum handler
│   ├── config.py            # Settings (env vars)
│   ├── models.py            # Pydantic models
│   ├── routers/
│   │   ├── carrier.py       # /api/carrier/verify
│   │   ├── loads.py         # /api/loads/search
│   │   ├── negotiate.py     # /api/negotiate
│   │   ├── calls.py         # /api/calls/log
│   │   └── metrics.py       # /api/metrics
│   └── services/
│       ├── fmcsa.py         # FMCSA API client (+ mock mode)
│       ├── negotiation.py   # Negotiation logic
│       ├── s3.py            # S3 read/write helpers
│       └── athena.py        # Metrics aggregation from S3 call logs
├── dashboard/               # React app (Vite + TS)
├── data/
│   └── loads.json           # 15 sample loads
├── infra/                   # AWS CDK stacks
│   ├── lib/
│   │   ├── config.ts        # AWS account, region, resource names
│   │   ├── infra-stack.ts   # API infra (Lambda, API GW, S3)
│   │   └── dashboard-stack.ts # Dashboard (S3 + CloudFront)
│   └── bin/infra.ts         # CDK app entry point
├── bin/
│   └── deploy.sh            # One-command deploy script
├── Dockerfile               # Lambda container image
├── docker-compose.yml       # Local dev
├── requirements.txt
└── agent_prompt.md          # HappyRobot agent persona & instructions
```

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/health` | GET | Health check |
| `/api/carrier/verify` | POST | Verify carrier MC# via FMCSA (mock mode when no API key) |
| `/api/loads/search` | POST | Search loads by origin, destination, equipment, dates |
| `/api/negotiate` | POST | Evaluate carrier offer — accept, counter, or reject |
| `/api/calls/log` | POST | Log call outcome, sentiment, and extracted data to S3 |
| `/api/metrics` | GET | Aggregated dashboard metrics from call logs |

## Negotiation Logic

- **Accept** if offer is at or below loadboard rate, or within 5% above
- **Counter** if offer is 5–30% above loadboard rate (meet in the middle)
- **Reject** if offer exceeds 30% above loadboard rate after 3 rounds
- Max 3 negotiation rounds

## Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- AWS CLI configured
- Finch or Docker
- AWS CDK (`npm install -g aws-cdk`)

### Local Development

```bash
# Install Python dependencies
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Run the API
uvicorn app.main:app --reload
# API available at http://localhost:8000
# Swagger docs at http://localhost:8000/docs
```

### Configuration

Copy `.env.example` to `.env` and set values:

```bash
HR_FMCSA_API_KEY=your_key    # Leave empty for mock mode (accepts 6-digit MC#s)
HR_API_KEY=your_key           # Leave empty to skip auth locally
HR_ENVIRONMENT=local          # "local" reads from disk, "production" uses S3
```

### Deploy to AWS

1. Update `infra/lib/config.ts` with your AWS account and region
2. Run the deploy script:

```bash
./bin/deploy.sh
```

This will:
- Refresh AWS credentials
- Bootstrap CDK (first time only)
- Build the Docker image with Finch
- Deploy both stacks (API infra + dashboard)
- Output the API URL, API key ID, and dashboard URL

### Deploy Individual Stacks

```bash
cd infra
cdk deploy HappyRobotStack              # API only
cdk deploy HappyRobotDashboardStack     # Dashboard only
```

### Get API Key Value

```bash
aws apigateway get-api-key --api-key <ApiKeyId> --include-value --query 'value' --output text
```

## Security

- HTTPS enforced via API Gateway
- API key required on all endpoints (API Gateway + app-level middleware)
- Rate limiting: 50 req/s, burst 100
- CORS enabled

## Deployed URLs

- **API:** https://qpklvz83y9.execute-api.us-east-1.amazonaws.com/prod/
- **Dashboard:** TBD (deploy `HappyRobotDashboardStack`)

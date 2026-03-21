from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    fmcsa_api_key: str = ""
    api_key: str = ""
    s3_bucket: str = "happyrobot-carrier-sales"
    loads_s3_key: str = "data/loads.json"
    call_logs_prefix: str = "call-logs/"
    environment: str = "local"

    model_config = {"env_prefix": "HR_", "env_file": ".env"}


settings = Settings()

FROM --platform=linux/arm64 public.ecr.aws/lambda/python:3.11

COPY requirements.txt ${LAMBDA_TASK_ROOT}/
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ ${LAMBDA_TASK_ROOT}/app/
COPY data/ ${LAMBDA_TASK_ROOT}/data/

CMD ["app.main.handler"]

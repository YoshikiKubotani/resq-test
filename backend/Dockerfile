FROM public.ecr.aws/lambda/python:3.12

COPY app.py ${LAMBDA_TASK_ROOT}
COPY prompts.py ${LAMBDA_TASK_ROOT}
COPY generate_questions.txt ${LAMBDA_TASK_ROOT}
COPY generate_reply.txt ${LAMBDA_TASK_ROOT}
COPY requirements.txt ${LAMBDA_TASK_ROOT}

RUN pip install -r ./requirements.txt

CMD ["app.handler"]
FROM python:3.15-rc-slim-trixie

WORKDIR /app
COPY . /app/

RUN pip install -r requirements.txt

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

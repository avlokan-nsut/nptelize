bind = "0.0.0.0:8000"
workers = 4
worker_class = "uvicorn.workers.UvicornWorker"
accesslog = "./logs/access.log"
errorlog = "./logs/error.log"
loglevel = "info"
max_requests = 1000
max_requests_jitter = 100
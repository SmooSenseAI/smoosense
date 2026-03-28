IMAGE_NAME ?= smoosense-app
PORT       ?= 8000

build:
	docker build -t $(IMAGE_NAME) .

run: build
	@echo "SmooSense running at http://localhost:$(PORT)"
	docker run --rm \
		-p $(PORT):8000 \
		$(IMAGE_NAME)

run-s3: build
	@echo "SmooSense running at http://localhost:$(PORT)"
	docker run --rm \
		-p $(PORT):8000 \
		-v $(HOME)/.aws:/root/.aws:ro \
		-e AWS_PROFILE \
		-e AWS_ENDPOINT_URL \
		$(IMAGE_NAME)

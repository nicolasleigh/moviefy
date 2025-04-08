.PHONY: frontend/build
frontend/build:
	@cd frontend && npm run build && cd ..

.PHONY: frontend/send
frontend/send:
	@cd frontend && scp -r dist nicolas@106.14.126.186:~/moviefy/react-build && cd ..

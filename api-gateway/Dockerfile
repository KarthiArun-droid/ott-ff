# Build Stage
FROM golang:1.20-alpine AS builder
WORKDIR /app
COPY main.go .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o api-gateway main.go

# Production Runtime Stage
FROM alpine:3.18
RUN apk --no-cache add ca-certificates && \
    addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /home/appuser
COPY --from=builder /app/api-gateway .
USER appuser
EXPOSE 8000
ENV PORT=8000
ENTRYPOINT ["./api-gateway"]

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "resq-backend"
}

variable "image_tag" {
  description = "Container image tag to deploy"
  type        = string
}

variable "ecr_repository_url" {
  description = "ECR Repository URL"
  type        = string
}

variable "ecr_repository_arn" {
  description = "ECR Repository ARN"
  type        = string
}

variable "lambda_memory_size" {
  description = "Lambda function memory size (MB)"
  type        = number
  default     = 512
}

variable "lambda_timeout" {
  description = "Lambda function timeout (seconds)"
  type        = number
  default     = 30
}

variable "allowed_origins" {
  description = "List of allowed origins for Lambda Function URL CORS"
  type        = list(string)
  default     = ["*"]  # Allow all origins in development environment
}

variable "openai_api_key" {
  description = "OpenAI API Key"
  type        = string
  sensitive   = true
}
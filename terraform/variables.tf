variable "environment" {
  description = "Environment name (dev/prod)"
  type        = string
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

variable "github_repository" {
  description = "GitHub repository name (e.g., owner/repo)"
  type        = string
}

variable "github_branch" {
  description = "GitHub branch to deploy"
  type        = string
}

variable "allowed_origins" {
  description = "List of allowed origins for Lambda Function URL CORS"
  type        = list(string)
}
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-1"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "resq-backend"
}

variable "github_repository" {
  description = "GitHub repository name (e.g., owner/repo)"
  type        = string
}
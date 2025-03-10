variable "environment" {
  description = "Environment name (dev/prod)"
  type        = string
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
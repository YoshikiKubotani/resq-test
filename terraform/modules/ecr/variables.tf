variable "environment" {
  description = "Environment name (dev/prod)"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "github_actions_role_name" {
  description = "GitHub Actions IAM Role name"
  type        = string
}
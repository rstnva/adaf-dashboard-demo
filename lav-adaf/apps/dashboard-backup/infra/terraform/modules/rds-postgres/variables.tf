# RDS PostgreSQL Module Variables

variable "project_name" {
  description = "Name of the project, used for resource naming"
  type        = string
  default     = "adaf"
}

variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be one of: dev, staging, production."
  }
}

variable "postgres_version" {
  description = "PostgreSQL engine version"
  type        = string
  default     = "15.4"
}

variable "instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "allocated_storage" {
  description = "Initial allocated storage in GB"
  type        = number
  default     = 20

  validation {
    condition     = var.allocated_storage >= 20
    error_message = "Allocated storage must be at least 20 GB for PostgreSQL."
  }
}

variable "max_allocated_storage" {
  description = "Maximum allocated storage for autoscaling in GB"
  type        = number
  default     = 100

  validation {
    condition     = var.max_allocated_storage >= var.allocated_storage
    error_message = "Max allocated storage must be greater than or equal to allocated storage."
  }
}

variable "database_name" {
  description = "Name of the database"
  type        = string
  default     = "adaf_db"

  validation {
    condition     = can(regex("^[a-zA-Z_][a-zA-Z0-9_]*$", var.database_name))
    error_message = "Database name must be alphanumeric and underscores only, starting with letter or underscore."
  }
}

variable "database_username" {
  description = "Master username for the database"
  type        = string
  default     = "postgres"

  validation {
    condition     = length(var.database_username) >= 1 && length(var.database_username) <= 63
    error_message = "Database username must be between 1 and 63 characters."
  }
}

variable "database_port" {
  description = "Port for the database"
  type        = number
  default     = 5432

  validation {
    condition     = var.database_port > 0 && var.database_port < 65536
    error_message = "Database port must be between 1 and 65535."
  }
}

variable "multi_az" {
  description = "Enable Multi-AZ deployment"
  type        = bool
  default     = false
}

variable "availability_zone" {
  description = "Availability zone for single-AZ deployment"
  type        = string
  default     = null
}

variable "backup_retention_period" {
  description = "Backup retention period in days"
  type        = number
  default     = 7

  validation {
    condition     = var.backup_retention_period >= 0 && var.backup_retention_period <= 35
    error_message = "Backup retention period must be between 0 and 35 days."
  }
}

variable "backup_window" {
  description = "Backup window in UTC (format: hh24:mi-hh24:mi)"
  type        = string
  default     = "03:00-04:00"

  validation {
    condition     = can(regex("^[0-2][0-9]:[0-5][0-9]-[0-2][0-9]:[0-5][0-9]$", var.backup_window))
    error_message = "Backup window must be in format hh24:mi-hh24:mi."
  }
}

variable "maintenance_window" {
  description = "Maintenance window in UTC (format: ddd:hh24:mi-ddd:hh24:mi)"
  type        = string
  default     = "sun:04:00-sun:05:00"

  validation {
    condition     = can(regex("^(mon|tue|wed|thu|fri|sat|sun):[0-2][0-9]:[0-5][0-9]-(mon|tue|wed|thu|fri|sat|sun):[0-2][0-9]:[0-5][0-9]$", var.maintenance_window))
    error_message = "Maintenance window must be in format ddd:hh24:mi-ddd:hh24:mi."
  }
}

variable "enhanced_monitoring_interval" {
  description = "Enhanced monitoring interval in seconds (0, 1, 5, 10, 15, 30, 60)"
  type        = number
  default     = 0

  validation {
    condition     = contains([0, 1, 5, 10, 15, 30, 60], var.enhanced_monitoring_interval)
    error_message = "Enhanced monitoring interval must be one of: 0, 1, 5, 10, 15, 30, 60."
  }
}

variable "performance_insights_enabled" {
  description = "Enable Performance Insights"
  type        = bool
  default     = false
}

variable "auto_minor_version_upgrade" {
  description = "Enable automatic minor version upgrades"
  type        = bool
  default     = true
}

variable "deletion_protection" {
  description = "Enable deletion protection"
  type        = bool
  default     = false
}

variable "skip_final_snapshot" {
  description = "Skip final snapshot when deleting"
  type        = bool
  default     = true
}

variable "max_connections" {
  description = "Maximum number of connections"
  type        = string
  default     = "100"
}

# Network configuration
variable "db_subnet_group_name" {
  description = "Name of the DB subnet group"
  type        = string
}

variable "security_group_ids" {
  description = "List of security group IDs"
  type        = list(string)
}

# Monitoring configuration
variable "create_cloudwatch_alarms" {
  description = "Create CloudWatch alarms for monitoring"
  type        = bool
  default     = true
}

variable "alarm_actions" {
  description = "List of ARNs to notify when alarm triggers"
  type        = list(string)
  default     = []
}

variable "secret_recovery_window" {
  description = "Recovery window for secrets manager secret deletion"
  type        = number
  default     = 7

  validation {
    condition     = var.secret_recovery_window >= 7 && var.secret_recovery_window <= 30
    error_message = "Secret recovery window must be between 7 and 30 days."
  }
}

variable "common_tags" {
  description = "Common tags to be applied to all resources"
  type        = map(string)
  default = {
    Project     = "ADAF"
    Environment = "dev"
    Owner       = "DevOps"
    ManagedBy   = "Terraform"
  }
}
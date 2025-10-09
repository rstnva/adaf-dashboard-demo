# ALB Module Variables

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

# ALB Configuration
variable "internal" {
  description = "Whether the load balancer is internal or internet-facing"
  type        = bool
  default     = false
}

variable "enable_deletion_protection" {
  description = "Enable deletion protection on the load balancer"
  type        = bool
  default     = false
}

variable "enable_cross_zone_load_balancing" {
  description = "Enable cross-zone load balancing"
  type        = bool
  default     = true
}

variable "enable_http2" {
  description = "Enable HTTP/2"
  type        = bool
  default     = true
}

variable "idle_timeout" {
  description = "Connection idle timeout in seconds"
  type        = number
  default     = 60

  validation {
    condition     = var.idle_timeout >= 1 && var.idle_timeout <= 4000
    error_message = "Idle timeout must be between 1 and 4000 seconds."
  }
}

variable "ip_address_type" {
  description = "Type of IP addresses used by the subnets"
  type        = string
  default     = "ipv4"

  validation {
    condition     = contains(["ipv4", "dualstack"], var.ip_address_type)
    error_message = "IP address type must be either ipv4 or dualstack."
  }
}

# Network Configuration
variable "vpc_id" {
  description = "VPC ID where the ALB will be created"
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs for the ALB"
  type        = list(string)

  validation {
    condition     = length(var.subnet_ids) >= 2
    error_message = "At least 2 subnets must be specified for ALB."
  }
}

variable "security_group_ids" {
  description = "List of security group IDs for the ALB"
  type        = list(string)
}

# Target Group Configuration
variable "target_port" {
  description = "Port on which targets receive traffic"
  type        = number
  default     = 3000

  validation {
    condition     = var.target_port > 0 && var.target_port < 65536
    error_message = "Target port must be between 1 and 65535."
  }
}

variable "target_protocol" {
  description = "Protocol to use for routing traffic to the targets"
  type        = string
  default     = "HTTP"

  validation {
    condition     = contains(["HTTP", "HTTPS"], var.target_protocol)
    error_message = "Target protocol must be either HTTP or HTTPS."
  }
}

variable "target_type" {
  description = "Type of target that you must specify when registering targets"
  type        = string
  default     = "ip"

  validation {
    condition     = contains(["instance", "ip", "lambda", "alb"], var.target_type)
    error_message = "Target type must be one of: instance, ip, lambda, alb."
  }
}

# Health Check Configuration
variable "health_check_path" {
  description = "Destination for the health check request"
  type        = string
  default     = "/health"
}

variable "health_check_protocol" {
  description = "Protocol to use for health checks"
  type        = string
  default     = "HTTP"

  validation {
    condition     = contains(["HTTP", "HTTPS"], var.health_check_protocol)
    error_message = "Health check protocol must be either HTTP or HTTPS."
  }
}

variable "health_check_matcher" {
  description = "Response codes to use when checking for a healthy responses"
  type        = string
  default     = "200"
}

variable "health_check_interval" {
  description = "Approximate amount of time between health checks"
  type        = number
  default     = 30

  validation {
    condition     = var.health_check_interval >= 5 && var.health_check_interval <= 300
    error_message = "Health check interval must be between 5 and 300 seconds."
  }
}

variable "health_check_timeout" {
  description = "Amount of time to wait when receiving a response from the health check"
  type        = number
  default     = 5

  validation {
    condition     = var.health_check_timeout >= 2 && var.health_check_timeout <= 120
    error_message = "Health check timeout must be between 2 and 120 seconds."
  }
}

variable "health_check_healthy_threshold" {
  description = "Number of consecutive health checks successes required"
  type        = number
  default     = 2

  validation {
    condition     = var.health_check_healthy_threshold >= 2 && var.health_check_healthy_threshold <= 10
    error_message = "Health check healthy threshold must be between 2 and 10."
  }
}

variable "health_check_unhealthy_threshold" {
  description = "Number of consecutive health check failures required"
  type        = number
  default     = 3

  validation {
    condition     = var.health_check_unhealthy_threshold >= 2 && var.health_check_unhealthy_threshold <= 10
    error_message = "Health check unhealthy threshold must be between 2 and 10."
  }
}

variable "deregistration_delay" {
  description = "Amount time for ELB to wait before changing the state of a deregistering target"
  type        = number
  default     = 300

  validation {
    condition     = var.deregistration_delay >= 0 && var.deregistration_delay <= 3600
    error_message = "Deregistration delay must be between 0 and 3600 seconds."
  }
}

# SSL/TLS Configuration
variable "certificate_arn" {
  description = "ARN of the SSL certificate for HTTPS listener"
  type        = string
  default     = null
}

variable "additional_certificate_arns" {
  description = "List of additional certificate ARNs for multi-domain support"
  type        = list(string)
  default     = []
}

variable "ssl_policy" {
  description = "Name of the SSL policy for HTTPS listeners"
  type        = string
  default     = "ELBSecurityPolicy-TLS-1-2-2017-01"
}

variable "enable_https_redirect" {
  description = "Enable redirect from HTTP to HTTPS"
  type        = bool
  default     = true
}

# Blue/Green Deployment Configuration
variable "active_target_group" {
  description = "Active target group for deployments (blue or green)"
  type        = string
  default     = "blue"

  validation {
    condition     = contains(["blue", "green"], var.active_target_group)
    error_message = "Active target group must be either 'blue' or 'green'."
  }
}

variable "enable_header_routing" {
  description = "Enable routing based on HTTP headers for blue/green testing"
  type        = bool
  default     = false
}

variable "blue_green_header_name" {
  description = "HTTP header name for blue/green routing"
  type        = string
  default     = "X-Deployment-Target"
}

variable "enable_canary_routing" {
  description = "Enable weighted routing for canary deployments"
  type        = bool
  default     = false
}

variable "canary_blue_weight" {
  description = "Weight for blue target group in canary deployment"
  type        = number
  default     = 90

  validation {
    condition     = var.canary_blue_weight >= 0 && var.canary_blue_weight <= 100
    error_message = "Canary blue weight must be between 0 and 100."
  }
}

variable "canary_green_weight" {
  description = "Weight for green target group in canary deployment"
  type        = number
  default     = 10

  validation {
    condition     = var.canary_green_weight >= 0 && var.canary_green_weight <= 100
    error_message = "Canary green weight must be between 0 and 100."
  }
}

# Stickiness Configuration
variable "enable_stickiness" {
  description = "Enable session stickiness"
  type        = bool
  default     = false
}

variable "stickiness_duration" {
  description = "Duration of the stickiness cookie in seconds"
  type        = number
  default     = 86400

  validation {
    condition     = var.stickiness_duration >= 1 && var.stickiness_duration <= 604800
    error_message = "Stickiness duration must be between 1 and 604800 seconds (7 days)."
  }
}

# Access Logs Configuration
variable "enable_access_logs" {
  description = "Enable access logs for the ALB"
  type        = bool
  default     = false
}

variable "access_logs_bucket" {
  description = "S3 bucket for access logs"
  type        = string
  default     = null
}

variable "access_logs_prefix" {
  description = "S3 prefix for access logs"
  type        = string
  default     = "alb-access-logs"
}

# Monitoring Configuration
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

variable "response_time_threshold" {
  description = "Response time threshold for alarms (seconds)"
  type        = number
  default     = 1.0
}

variable "healthy_host_threshold" {
  description = "Minimum number of healthy hosts"
  type        = number
  default     = 1
}

variable "http_5xx_threshold" {
  description = "Threshold for 5XX errors"
  type        = number
  default     = 10
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
# Redis ElastiCache Module - Cluster with replication and monitoring

# Redis Auth Token
resource "random_password" "redis_auth_token" {
  count   = var.auth_token_enabled ? 1 : 0
  length  = 64
  special = false
}

# KMS key for encryption
resource "aws_kms_key" "redis" {
  count = var.at_rest_encryption_enabled ? 1 : 0

  description             = "KMS key for Redis ElastiCache encryption"
  deletion_window_in_days = 7

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-redis-kms-key"
  })
}

resource "aws_kms_alias" "redis" {
  count = var.at_rest_encryption_enabled ? 1 : 0

  name          = "alias/${var.project_name}-redis"
  target_key_id = aws_kms_key.redis[0].key_id
}

# Parameter Group
resource "aws_elasticache_parameter_group" "redis" {
  family = "redis7.x"
  name   = "${var.project_name}-redis-params"

  dynamic "parameter" {
    for_each = var.redis_parameters
    content {
      name  = parameter.value.name
      value = parameter.value.value
    }
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-redis-params"
  })
}

# Replication Group (Cluster)
resource "aws_elasticache_replication_group" "redis" {
  replication_group_id       = "${var.project_name}-redis"
  description                = "Redis cluster for ${var.project_name}"
  
  # Engine configuration
  engine               = "redis"
  engine_version       = var.redis_version
  node_type            = var.node_type
  port                 = var.redis_port
  parameter_group_name = aws_elasticache_parameter_group.redis.name

  # Cluster configuration
  num_cache_clusters         = var.num_cache_clusters
  replicas_per_node_group   = var.replicas_per_node_group
  num_node_groups           = var.num_node_groups
  automatic_failover_enabled = var.automatic_failover_enabled
  multi_az_enabled          = var.multi_az_enabled

  # Network configuration
  subnet_group_name  = var.subnet_group_name
  security_group_ids = var.security_group_ids

  # Backup and maintenance
  snapshot_retention_limit = var.snapshot_retention_limit
  snapshot_window         = var.snapshot_window
  maintenance_window      = var.maintenance_window
  apply_immediately       = var.environment != "production"

  # Encryption
  at_rest_encryption_enabled = var.at_rest_encryption_enabled
  transit_encryption_enabled = var.transit_encryption_enabled
  kms_key_id                = var.at_rest_encryption_enabled ? aws_kms_key.redis[0].arn : null
  auth_token                = var.auth_token_enabled ? random_password.redis_auth_token[0].result : null

  # Logging
  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis_slow.name
    destination_type = "cloudwatch-logs"
    log_format       = "text"
    log_type         = "slow-log"
  }

  # Notifications
  notification_topic_arn = var.notification_topic_arn

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-redis-cluster"
  })

  depends_on = [aws_cloudwatch_log_group.redis_slow]
}

# CloudWatch Log Group for Redis slow logs
resource "aws_cloudwatch_log_group" "redis_slow" {
  name              = "/aws/elasticache/redis/${var.project_name}/slow-log"
  retention_in_days = var.log_retention_days

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-redis-slow-log"
  })
}

# Store Redis auth token in AWS Secrets Manager
resource "aws_secretsmanager_secret" "redis_auth_token" {
  count = var.auth_token_enabled ? 1 : 0

  name                    = "${var.project_name}/redis/auth-token"
  description             = "Redis auth token"
  recovery_window_in_days = var.secret_recovery_window

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-redis-auth-token"
  })
}

resource "aws_secretsmanager_secret_version" "redis_auth_token" {
  count = var.auth_token_enabled ? 1 : 0

  secret_id = aws_secretsmanager_secret.redis_auth_token[0].id
  secret_string = jsonencode({
    auth_token = random_password.redis_auth_token[0].result
    endpoint   = aws_elasticache_replication_group.redis.configuration_endpoint_address != "" ? aws_elasticache_replication_group.redis.configuration_endpoint_address : aws_elasticache_replication_group.redis.primary_endpoint_address
    port       = aws_elasticache_replication_group.redis.port
  })

  lifecycle {
    ignore_changes = [secret_string]
  }
}

# CloudWatch alarms for monitoring
resource "aws_cloudwatch_metric_alarm" "redis_cpu_utilization" {
  count = var.create_cloudwatch_alarms ? 1 : 0

  alarm_name          = "${var.project_name}-redis-cpu-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ElastiCache"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors Redis CPU utilization"
  alarm_actions       = var.alarm_actions

  dimensions = {
    CacheClusterId = "${aws_elasticache_replication_group.redis.replication_group_id}-001"
  }

  tags = var.common_tags
}

resource "aws_cloudwatch_metric_alarm" "redis_memory_utilization" {
  count = var.create_cloudwatch_alarms ? 1 : 0

  alarm_name          = "${var.project_name}-redis-memory-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseMemoryUsagePercentage"
  namespace           = "AWS/ElastiCache"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors Redis memory utilization"
  alarm_actions       = var.alarm_actions

  dimensions = {
    CacheClusterId = "${aws_elasticache_replication_group.redis.replication_group_id}-001"
  }

  tags = var.common_tags
}

resource "aws_cloudwatch_metric_alarm" "redis_evictions" {
  count = var.create_cloudwatch_alarms ? 1 : 0

  alarm_name          = "${var.project_name}-redis-evictions"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Evictions"
  namespace           = "AWS/ElastiCache"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "This metric monitors Redis evictions"
  alarm_actions       = var.alarm_actions

  dimensions = {
    CacheClusterId = "${aws_elasticache_replication_group.redis.replication_group_id}-001"
  }

  tags = var.common_tags
}

resource "aws_cloudwatch_metric_alarm" "redis_replication_lag" {
  count = var.create_cloudwatch_alarms && var.num_cache_clusters > 1 ? 1 : 0

  alarm_name          = "${var.project_name}-redis-replication-lag"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ReplicationLag"
  namespace           = "AWS/ElastiCache"
  period              = "300"
  statistic           = "Average"
  threshold           = "5"
  alarm_description   = "This metric monitors Redis replication lag"
  alarm_actions       = var.alarm_actions

  dimensions = {
    CacheClusterId = "${aws_elasticache_replication_group.redis.replication_group_id}-002"
  }

  tags = var.common_tags
}
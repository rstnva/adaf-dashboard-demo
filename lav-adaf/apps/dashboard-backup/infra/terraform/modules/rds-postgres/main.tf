# RDS PostgreSQL Module - Multi-AZ with automated backups and monitoring

# Random password for database
resource "random_password" "db_password" {
  length  = 32
  special = true
}

# KMS key for encryption
resource "aws_kms_key" "rds" {
  description             = "KMS key for RDS encryption"
  deletion_window_in_days = 7

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-rds-kms-key"
  })
}

resource "aws_kms_alias" "rds" {
  name          = "alias/${var.project_name}-rds"
  target_key_id = aws_kms_key.rds.key_id
}

# DB Parameter Group
resource "aws_db_parameter_group" "main" {
  family = "postgres15"
  name   = "${var.project_name}-postgres-params"

  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements"
  }

  parameter {
    name  = "log_statement"
    value = "all"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }

  parameter {
    name  = "max_connections"
    value = var.max_connections
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-postgres-params"
  })
}

# DB Option Group
resource "aws_db_option_group" "main" {
  name                     = "${var.project_name}-postgres-options"
  option_group_description = "Option group for PostgreSQL"
  engine_name              = "postgres"
  major_engine_version     = "15"

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-postgres-options"
  })
}

# RDS Instance
resource "aws_db_instance" "main" {
  identifier = "${var.project_name}-postgres"

  # Engine configuration
  engine                = "postgres"
  engine_version        = var.postgres_version
  instance_class        = var.instance_class
  allocated_storage     = var.allocated_storage
  max_allocated_storage = var.max_allocated_storage
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id           = aws_kms_key.rds.arn

  # Database configuration
  db_name  = var.database_name
  username = var.database_username
  password = random_password.db_password.result
  port     = var.database_port

  # Network configuration
  db_subnet_group_name   = var.db_subnet_group_name
  vpc_security_group_ids = var.security_group_ids
  publicly_accessible    = false

  # Parameter and option groups
  parameter_group_name = aws_db_parameter_group.main.name
  option_group_name    = aws_db_option_group.main.name

  # Multi-AZ and availability
  multi_az               = var.multi_az
  availability_zone      = var.multi_az ? null : var.availability_zone
  backup_retention_period = var.backup_retention_period
  backup_window          = var.backup_window
  maintenance_window     = var.maintenance_window

  # Monitoring and logging
  monitoring_interval             = var.enhanced_monitoring_interval
  monitoring_role_arn            = var.enhanced_monitoring_interval > 0 ? aws_iam_role.rds_monitoring[0].arn : null
  performance_insights_enabled   = var.performance_insights_enabled
  performance_insights_kms_key_id = var.performance_insights_enabled ? aws_kms_key.rds.arn : null
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  # Security and maintenance
  auto_minor_version_upgrade = var.auto_minor_version_upgrade
  deletion_protection       = var.deletion_protection
  skip_final_snapshot      = var.skip_final_snapshot
  final_snapshot_identifier = var.skip_final_snapshot ? null : "${var.project_name}-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"
  copy_tags_to_snapshot    = true

  # Apply changes immediately in non-production environments
  apply_immediately = var.environment != "production"

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-postgres"
  })

  depends_on = [aws_iam_role.rds_monitoring]
}

# Enhanced monitoring role
resource "aws_iam_role" "rds_monitoring" {
  count = var.enhanced_monitoring_interval > 0 ? 1 : 0

  name = "${var.project_name}-rds-monitoring-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = var.common_tags
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  count = var.enhanced_monitoring_interval > 0 ? 1 : 0

  role       = aws_iam_role.rds_monitoring[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# Store password in AWS Secrets Manager
resource "aws_secretsmanager_secret" "db_password" {
  name                    = "${var.project_name}/rds/postgres/password"
  description             = "PostgreSQL database password"
  recovery_window_in_days = var.secret_recovery_window

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-rds-password"
  })
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id = aws_secretsmanager_secret.db_password.id
  secret_string = jsonencode({
    username            = aws_db_instance.main.username
    password            = random_password.db_password.result
    engine              = "postgres"
    host                = aws_db_instance.main.endpoint
    port                = aws_db_instance.main.port
    dbname              = aws_db_instance.main.db_name
    dbInstanceIdentifier = aws_db_instance.main.identifier
  })

  lifecycle {
    ignore_changes = [secret_string]
  }
}

# CloudWatch alarms for monitoring
resource "aws_cloudwatch_metric_alarm" "database_cpu" {
  count = var.create_cloudwatch_alarms ? 1 : 0

  alarm_name          = "${var.project_name}-rds-cpu-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "120"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS CPU utilization"
  alarm_actions       = var.alarm_actions

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = var.common_tags
}

resource "aws_cloudwatch_metric_alarm" "database_connections" {
  count = var.create_cloudwatch_alarms ? 1 : 0

  alarm_name          = "${var.project_name}-rds-connection-count"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "120"
  statistic           = "Average"
  threshold           = var.max_connections * 0.8
  alarm_description   = "This metric monitors RDS connection count"
  alarm_actions       = var.alarm_actions

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = var.common_tags
}

resource "aws_cloudwatch_metric_alarm" "database_free_storage_space" {
  count = var.create_cloudwatch_alarms ? 1 : 0

  alarm_name          = "${var.project_name}-rds-free-storage-space"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = "120"
  statistic           = "Average"
  threshold           = var.allocated_storage * 1024 * 1024 * 1024 * 0.2 # 20% of allocated storage in bytes
  alarm_description   = "This metric monitors RDS free storage space"
  alarm_actions       = var.alarm_actions

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = var.common_tags
}
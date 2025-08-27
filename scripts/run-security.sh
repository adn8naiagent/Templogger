#!/bin/bash
snyk test --severity-threshold=high
snyk code test
snyk monitor

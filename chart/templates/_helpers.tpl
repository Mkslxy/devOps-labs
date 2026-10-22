# DVO-L4-3C8B52
{{/*
Expand the name of the chart.
*/}}
{{- define "unischool.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "unischool.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "unischool.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels (including requirement A.3: mascot: гарбуз)
*/}}
{{- define "unischool.labels" -}}
helm.sh/chart: {{ include "unischool.chart" . }}
{{ include "unischool.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
mascot: harbuz # mascot: гарбуз
{{- end }}

{{/*
Selector labels
*/}}
{{- define "unischool.selectorLabels" -}}
app.kubernetes.io/name: {{ include "unischool.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Common annotations (including requirement A.3: devops-lab/mascot-approved: "true")
*/}}
{{- define "unischool.annotations" -}}
devops-lab/mascot-approved: "true"
mascot: "гарбуз"
{{- end }}

import { InfoCard, Progress } from '@backstage/core-components';
import {
  configApiRef,
  fetchApiRef,
  useApi,
} from '@backstage/frontend-plugin-api';
import {
  Box,
  Button,
  Grid,
  MenuItem,
  TextField,
  Typography,
} from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import React, { useMemo, useState } from 'react';

type PreviewResult = {
  sigla: string;
  ambiente: string;
  service: string;
  aws_account_alias: string;
  aws_account_id: string;
  aws_region: string;
  secret_name: string;
  action: string;
  merge_strategy: string;
  default_tags: Record<string, string>;
  field_names: string[];
};

type ApiResponse = {
  preview?: PreviewResult;
  result?: PreviewResult & {
    status: string;
    executor: string;
  };
  error?: string;
  message?: string;
};

type SecretFormState = {
  sigla: string;
  ambiente: string;
  secretBaseName: string;
  username: string;
  password: string;
  endpoint: string;
};

const initialState: SecretFormState = {
  sigla: 'dtlk',
  ambiente: 'hml',
  secretBaseName: 'documentdb/app-config',
  username: 'svc_dtlk',
  password: '',
  endpoint: '',
};

export const SecretsPage = () => {
  const configApi = useApi(configApiRef);
  const fetchApi = useApi(fetchApiRef);

  const [formData, setFormData] = useState<SecretFormState>(initialState);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [applyResult, setApplyResult] = useState<ApiResponse['result'] | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingApply, setLoadingApply] = useState(false);

  const backendBaseUrl = configApi.getOptionalString('backend.baseUrl');
  const brokerBaseUrl = backendBaseUrl
    ? `${backendBaseUrl}/api/proxy/secrets-broker`
    : '/api/proxy/secrets-broker';

  const payload = useMemo(
    () => ({
      sigla: formData.sigla.trim().toLowerCase(),
      ambiente: formData.ambiente.trim().toLowerCase(),
      secret_base_name: formData.secretBaseName.trim().replace(/^\/+/, ''),
      fields: {
        username: formData.username,
        password: formData.password,
        ...(formData.endpoint ? { endpoint: formData.endpoint } : {}),
      },
    }),
    [formData],
  );

  const handleChange =
    (field: keyof SecretFormState) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormData(current => ({
        ...current,
        [field]: event.target.value,
      }));
    };

  const runRequest = async (path: 'preview' | 'apply') => {
    const response = await fetchApi.fetch(`${brokerBaseUrl}/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as ApiResponse;
    if (!response.ok) {
      throw new Error(data.error ?? 'Falha ao consultar o broker de secrets.');
    }

    return data;
  };

  const handlePreview = async () => {
    setError(null);
    setApplyResult(null);
    setLoadingPreview(true);

    try {
      const data = await runRequest('preview');
      setPreview(data.preview ?? null);
    } catch (requestError) {
      setPreview(null);
      setError(
        requestError instanceof Error ? requestError.message : 'Erro inesperado.',
      );
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleApply = async () => {
    setError(null);
    setLoadingApply(true);

    try {
      const data = await runRequest('apply');
      setApplyResult(data.result ?? null);
    } catch (requestError) {
      setApplyResult(null);
      setError(
        requestError instanceof Error ? requestError.message : 'Erro inesperado.',
      );
    } finally {
      setLoadingApply(false);
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <InfoCard title="Solicitar Secret">
          <Box display="flex" flexDirection="column" gridGap={16}>
            <Typography variant="body2" color="textSecondary">
              O DEV informa o minimo. O portal resolve conta, regiao, nome do
              secret e a acao esperada via broker.
            </Typography>

            <TextField
              label="Sigla"
              value={formData.sigla}
              onChange={handleChange('sigla')}
              helperText="Ex.: dtlk"
              variant="outlined"
              fullWidth
            />

            <TextField
              select
              label="Ambiente"
              value={formData.ambiente}
              onChange={handleChange('ambiente')}
              variant="outlined"
              fullWidth
            >
              <MenuItem value="hml">hml</MenuItem>
              <MenuItem value="prd">prd</MenuItem>
            </TextField>

            <TextField
              label="Secret Base Name"
              value={formData.secretBaseName}
              onChange={handleChange('secretBaseName')}
              helperText="Ex.: documentdb/app-config"
              variant="outlined"
              fullWidth
            />

            <TextField
              label="Username"
              value={formData.username}
              onChange={handleChange('username')}
              variant="outlined"
              fullWidth
            />

            <TextField
              label="Password"
              value={formData.password}
              onChange={handleChange('password')}
              type="password"
              variant="outlined"
              fullWidth
            />

            <TextField
              label="Endpoint"
              value={formData.endpoint}
              onChange={handleChange('endpoint')}
              helperText="Opcional para o MVP"
              variant="outlined"
              fullWidth
            />

            <Box display="flex" gridGap={12}>
              <Button
                color="primary"
                variant="contained"
                onClick={handlePreview}
                disabled={loadingPreview || loadingApply}
              >
                Gerar Preview
              </Button>
              <Button
                color="secondary"
                variant="contained"
                onClick={handleApply}
                disabled={loadingPreview || loadingApply}
              >
                Simular Apply
              </Button>
            </Box>
          </Box>
        </InfoCard>
      </Grid>

      <Grid item xs={12} md={6}>
        <InfoCard title="Preview do Broker">
          {loadingPreview || loadingApply ? <Progress /> : null}

          {!loadingPreview && !loadingApply && !preview && !applyResult && !error ? (
            <Typography variant="body2" color="textSecondary">
              Gere um preview para visualizar conta, regiao, nome padrao e acao.
            </Typography>
          ) : null}

          {error ? <Alert severity="error">{error}</Alert> : null}

          {preview ? (
            <Box display="flex" flexDirection="column" gridGap={12}>
              <Alert severity="info">
                Acao sugerida: <strong>{preview.action}</strong>
              </Alert>
              <PreviewDetails preview={preview} />
            </Box>
          ) : null}

          {applyResult ? (
            <Box mt={2} display="flex" flexDirection="column" gridGap={12}>
              <Alert severity="success">
                {applyResult.status} via {applyResult.executor}
              </Alert>
              <PreviewDetails preview={applyResult} />
            </Box>
          ) : null}
        </InfoCard>
      </Grid>
    </Grid>
  );
};

const PreviewDetails = ({ preview }: { preview: PreviewResult }) => (
  <Box display="flex" flexDirection="column" gridGap={10}>
    <Field label="Conta AWS" value={`${preview.aws_account_alias} (${preview.aws_account_id})`} />
    <Field label="Regiao" value={preview.aws_region} />
    <Field label="Servico" value={preview.service} />
    <Field label="Secret Name" value={preview.secret_name} />
    <Field label="Merge Strategy" value={preview.merge_strategy} />
    <Field label="Campos" value={preview.field_names.join(', ')} />
    <Field
      label="Tags"
      value={Object.entries(preview.default_tags)
        .map(([key, value]) => `${key}=${value}`)
        .join(', ')}
    />
  </Box>
);

const Field = ({ label, value }: { label: string; value: string }) => (
  <Box>
    <Typography variant="subtitle2">{label}</Typography>
    <Typography variant="body2" color="textSecondary">
      {value}
    </Typography>
  </Box>
);

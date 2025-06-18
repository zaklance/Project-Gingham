import { WebTracerProvider, BatchSpanProcessor } from '@opentelemetry/sdk-trace-web';
import { OTLPTraceExporter } from '@opentelemetry/exporter-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { XMLHttpRequestInstrumentation } from '@opentelemetry/instrumentation-xml-http-request';
import { registerInstrumentations } from '@opentelemetry/instrumentation';

const initTelemetry = () => {
    const proxyUrl = import.meta.env.VITE_PROXY_URL;
    const apiRegex = new RegExp(`^${proxyUrl.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}/api.*`);

    // Create a resource
    const resource = new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: 'react-frontend',
        [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
        [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: import.meta.env.VITE_ENVIRONMENT || 'development',
    });

    // Create a tracer provider
    const provider = new WebTracerProvider({
        resource: resource,
    });

    // Create an exporter
    const exporter = new OTLPTraceExporter({
        url: import.meta.env.VITE_OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
        headers: import.meta.env.VITE_OTEL_API_KEY ? {
            'Authorization': `Bearer ${import.meta.env.VITE_OTEL_API_KEY}`
        } : {},
    });

    // Add the span processor
    provider.addSpanProcessor(new BatchSpanProcessor(exporter));

    // Register the tracer provider
    provider.register();

    // Register instrumentations
    registerInstrumentations({
        instrumentations: [
            new FetchInstrumentation({
                propagateTraceHeaderCorsUrls: [
                    apiRegex
                ],
                clearTimingResources: true,
            }),
            new XMLHttpRequestInstrumentation({
                propagateTraceHeaderCorsUrls: [
                    apiRegex
                ],
            }),
        ],
    });

    console.log('OpenTelemetry initialized successfully');
};

export default initTelemetry;
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.sdk.resources import Resource
from opentelemetry.instrumentation.flask import FlaskInstrumentor
from opentelemetry.instrumentation.psycopg2 import Psycopg2Instrumentor
import os

def init_telemetry(app, service_name="flask-app"):
    # Create resource with service information
    resource = Resource.create({
        "service.name": service_name,
        "service.version": "1.0.0",
        "deployment.environment": os.getenv("ENVIRONMENT", "development")
    })
    
    # Set up tracer provider
    trace.set_tracer_provider(TracerProvider(resource=resource))
    tracer = trace.get_tracer(__name__)
    
    # Configure OTLP exporter for New Relic
    otlp_exporter = OTLPSpanExporter(
        endpoint=os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "https://otlp.nr-data.net:4317"),
        headers={"api-key": os.getenv('OTEL_API_KEY')} if os.getenv('OTEL_API_KEY') else {}
    )
    
    # Add span processor
    span_processor = BatchSpanProcessor(otlp_exporter)
    trace.get_tracer_provider().add_span_processor(span_processor)
    
    # Instrument Flask
    FlaskInstrumentor().instrument_app(app)
    
    # Instrument PostgreSQL with psycopg2
    Psycopg2Instrumentor().instrument()
    
    # SQLAlchemy instrumentation not needed for direct psycopg2
    
    return tracer

def add_custom_span(tracer, name, attributes=None):
    """Helper function to create custom spans"""
    with tracer.start_as_current_span(name) as span:
        if attributes:
            for key, value in attributes.items():
                span.set_attribute(key, value)
        return span
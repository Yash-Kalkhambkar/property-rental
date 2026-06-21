"""
Pytest configuration and shared fixtures for property-based tests.
"""
from hypothesis import settings, Verbosity

# Configure Hypothesis settings
settings.register_profile("default", max_examples=20, verbosity=Verbosity.normal)
settings.register_profile("ci", max_examples=100, verbosity=Verbosity.verbose)
settings.load_profile("default")

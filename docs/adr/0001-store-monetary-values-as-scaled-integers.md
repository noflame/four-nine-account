# Store monetary values as scaled integers

The system stores money and prices as 64-bit integers multiplied by 10,000, and converts them only at API or display boundaries. This avoids floating-point rounding errors while supporting fractional currency and stock quantities; all schemas, migrations, API calculations, and clients must preserve the same scale.

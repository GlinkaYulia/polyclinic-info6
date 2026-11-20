SPEC_PATH = File.join(__dir__, '..', 'openapi.yaml')

get '/api/openapi.yaml' do
  content_type 'application/yaml'
  File.read(SPEC_PATH)
end

# Інтерактивна документація Swagger UI
get '/docs' do
  content_type :html
  <<~HTML
    <!DOCTYPE html>
    <html lang="uk">
      <head>
        <meta charset="utf-8">
        <title>API документація</title>
        <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
      </head>
      <body>
        <div id="swagger-ui"></div>
        <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
        <script>
          window.onload = function () {
            window.ui = SwaggerUIBundle({ url: '/api/openapi.yaml', dom_id: '#swagger-ui' });
          };
        </script>
      </body>
    </html>
  HTML
end

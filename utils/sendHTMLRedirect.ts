export const sendHtmlRedirect = (
    res: any,
    destination: string,
    message: string = "Redirecting...",
    delayMs: number = 1500
  ) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Redirecting...</title>
            <style>
              html, body {
                margin: 0;
                padding: 0;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: sans-serif;
                background: #f9f9f9;
                color: #333;
              }
            </style>
            <script>
              window.onload = function () {
                setTimeout(() => {
                  window.location.href = "${destination}";
                }, ${delayMs});
              };
            </script>
          </head>
          <body>
            <div>
              <h2>${message}</h2>
              <p>Hang tight, you’ll be redirected shortly.</p>
            </div>
          </body>
        </html>
      `);
      
  };
  
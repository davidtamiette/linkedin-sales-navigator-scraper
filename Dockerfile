# Usa a imagem base do Node.js
FROM apify/actor-node:16

# Copia os arquivos de package.json para instalar dependências
COPY package.json ./

# Instala as dependências do projeto
RUN npm --quiet set progress=false \
 && npm install --only=prod --no-optional \
 && echo "Dependências instaladas com sucesso!"

# Copia o código-fonte do ator
COPY . ./

# Verifica se existe o schema de inputs e o arquivo principal
RUN test -f INPUT_SCHEMA.json \
 && test -f main.js \
 && echo "Arquivos essenciais estão presentes!"

# Define o comando para executar o ator
CMD ["node", "main.js"]
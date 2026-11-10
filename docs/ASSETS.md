# Origem e uso dos arquivos

## Símbolos oficiais

Fonte: [Figma Vitrine Glauber](https://www.figma.com/design/0g8UyUy7EXtzs0sLhXhoNd?node-id=5-16), verificado durante a reconstrução de 29/10/2026.

| Arquivo ativo                      | Exportação de origem | Uso              |
| ---------------------------------- | -------------------- | ---------------- |
| `public/brand/symbol-color.svg`    | `root430`            | Símbolo colorido |
| `public/brand/symbol-negative.svg` | `root290`            | Símbolo negativo |
| `public/brand/symbol-blue.svg`     | `root320`            | Símbolo azul     |

São arquivos obtidos da identidade fornecida, sem redesenho. A assinatura textual na interface é composta em `BrandLogo.vue`. Os antigos logos estão em `docs/archive/public/brand`.

## Imagens fornecidas com o projeto

`hero-feira-cultural.png` e `produtos-artesanais.png` já acompanhavam o projeto. Seus arquivos-fonte foram preservados em `docs/archive/public/images`. As versões WebP servidas pela aplicação estão em `public/images`. São imagens ilustrativas; sua presença no projeto não permite inferir autoria ou licença não documentada. Confirme a autorização antes de publicação definitiva.

## Fotografias de catálogo

Arquivos locais em `public/images/catalog`. Cada URL abaixo foi obtida com os parâmetros `?auto=format&fit=crop&w=900&q=85`. As imagens são ilustrativas e não representam os produtos, expositores ou pessoas nomeados no catálogo demonstrativo.

| Arquivo        | Origem                                                                                                   | Crédito identificado            |
| -------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------- |
| `ceramica.jpg` | [Unsplash](https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?auto=format&fit=crop&w=900&q=85) | Não identificado neste registro |
| `cafe.jpg`     | [Unsplash](https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=900&q=85) | Não identificado neste registro |
| `natural.jpg`  | [Unsplash](https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=900&q=85) | Não identificado neste registro |
| `caneca.jpg`   | [Unsplash](https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=900&q=85) | Não identificado neste registro |
| `geleia.jpg`   | [Unsplash](https://images.unsplash.com/photo-1644221362204-a265a2ca7e55?auto=format&fit=crop&w=900&q=85) | Cristina Pop                    |
| `doces.jpg`    | [Unsplash](https://images.unsplash.com/photo-1633129827988-b660aaab30dc?auto=format&fit=crop&w=900&q=85) | Max Jenssen                     |
| `sabonete.jpg` | [Unsplash](https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?auto=format&fit=crop&w=900&q=85) | Não identificado neste registro |

Não completar créditos por suposição. Antes de substituir fotos ou reutilizá-las em outro contexto, confirme a página de origem e os termos aplicáveis do provedor. A aplicação usa cópias locais e não depende dessas URLs para exibir o catálogo.

## Fontes

Inter e Outfit foram obtidas pelo CSS do Google Fonts e são servidas localmente em `public/fonts`, nos pesos 400, 500, 600 e 700. Os arquivos de licença OFL (`Inter-LICENSE.txt` e `Outfit-LICENSE.txt`) acompanham as famílias. O registro CSS está em `src/styles/fonts.css`. Preserve os avisos das licenças ao redistribuir as fontes. Liberation Sans é um ativo histórico em `docs/archive/public/fonts` e não é carregada pela interface atual.

## Arquivo histórico

`docs/archive/design-demos` preserva as explorações antigas; `docs/archive/public` preserva logos, fontes e PNGs de origem que não fazem parte dos arquivos ativos. Eles não devem substituir a direção oficial aprovada em 29/10/2026.

## Identidade própria da gestão

Origem: prancha `20:2`, no mesmo Figma oficial. Os SVGs são exportações originais, sem alteração dos vetores ou das dimensões de raiz. `ManagementSymbol.vue` posiciona as duas camadas nas proporções fornecidas pelo Figma, e `ManagementBrand.vue` acrescenta a assinatura em Outfit.

| Arquivo em public/brand        | Camada de origem | Uso                          |
| ------------------------------ | ---------------- | ---------------------------- |
| management-g.svg               | 22:247           | G principal                  |
| management-panels.svg          | 22:249           | Painéis coloridos            |
| management-g-negative.svg      | 22:263           | G negativo                   |
| management-panels-negative.svg | 22:265           | Painéis na variante negativa |

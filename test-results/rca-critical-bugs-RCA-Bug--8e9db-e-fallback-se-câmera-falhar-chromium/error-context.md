# Page snapshot

```yaml
- generic [ref=e1]:
  - banner [ref=e2]:
    - generic [ref=e3]:
      - button "Voltar" [ref=e4] [cursor=pointer]:
        - img [ref=e5]
      - generic [ref=e7]:
        - img [ref=e9]
        - generic [ref=e15]:
          - heading "Scanner QR" [level=1] [ref=e16]
          - paragraph [ref=e17]: Escaneie qualquer QR
  - generic [ref=e19]:
    - img [ref=e20]
    - paragraph [ref=e22]: Erro ao Acessar Câmera
    - paragraph [ref=e23]: Não foi possível acessar a câmera. Use a busca manual.
    - generic [ref=e24]:
      - button "Tentar Novamente" [ref=e25] [cursor=pointer]
      - button "Enviar Imagem" [ref=e26] [cursor=pointer]:
        - img [ref=e27]
        - text: Enviar Imagem
  - generic [ref=e30]:
    - paragraph [ref=e31]: Ou digite a placa / código do projeto
    - generic [ref=e32]:
      - textbox "Código do projeto ou placa" [ref=e33]:
        - /placeholder: ABC-1D23 ou PRJ-2025-001
      - button "Buscar" [disabled] [ref=e34]:
        - img [ref=e35]
    - button "Enviar imagem do QR Code" [ref=e38] [cursor=pointer]:
      - img [ref=e39]
      - text: Enviar imagem do QR Code
```
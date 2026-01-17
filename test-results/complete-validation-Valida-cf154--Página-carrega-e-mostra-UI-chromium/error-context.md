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
          - paragraph [ref=e17]: Escaneie o QR Code
  - generic [ref=e20]:
    - img [ref=e22]
    - paragraph [ref=e25]: Escanear QR Code
    - paragraph [ref=e26]: Aponte a câmera para o QR Code do veículo
    - paragraph [ref=e27]: 🔓 Acesso público - sem necessidade de login
    - generic [ref=e28]:
      - button "Abrir Câmera" [ref=e29] [cursor=pointer]:
        - img [ref=e30]
        - text: Abrir Câmera
      - button "Enviar da Galeria" [ref=e33] [cursor=pointer]:
        - img [ref=e34]
        - text: Enviar da Galeria
  - generic [ref=e37]:
    - paragraph [ref=e38]: Ou digite a placa / código do projeto
    - generic [ref=e39]:
      - textbox "ABC-1D23 ou PRJ-2025-001" [ref=e40]
      - button "Buscar" [disabled] [ref=e41]:
        - img [ref=e42]
    - button "Enviar imagem do QR Code" [ref=e45] [cursor=pointer]:
      - img [ref=e46]
      - text: Enviar imagem do QR Code
```
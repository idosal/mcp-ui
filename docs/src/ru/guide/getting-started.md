# Начало работы

Это руководство проведет вас через настройку вашей среды разработки и использование пакетов MCP-UI SDK.

## Предварительные требования

- Node.js (рекомендуется v22.x)
- pnpm (рекомендуется v9 или более поздняя)

## Установка

1.  **Клонируйте Монорепозиторий**:

    ```bash
    git clone https://github.com/idosal/mcp-ui.git
    cd mcp-ui
    ```

2.  **Установите Зависимости**:
    Из корня монорепозитория `mcp-ui` выполните:
    ```bash
    pnpm install
    ```
    Эта команда устанавливает зависимости для всех пакетов (`shared`, `client`, `server`, `docs`) и связывает их вместе с помощью pnpm.

## Сборка Пакетов

Для сборки всех библиотечных пакетов (`shared`, `client`, `server`):

```bash
pnpm --filter=!@mcp-ui/docs build
```

Каждый пакет использует Vite для сборки и выводит распространяемые файлы в соответствующий каталог `dist`.

## Запуск Тестов

Для запуска всех тестов в монорепозитории с использованием Vitest:

```bash
pnpm test
```

Или для покрытия:

```bash
pnpm run coverage
```

## Использование Пакетов

После сборки вы обычно можете импортировать из пакетов так же, как и из любого другого модуля npm, при условии, что ваш проект настроен на их разрешение (например, если вы публикуете их или используете такой инструмент, как `yalc` для локальной разработки вне этого монорепозитория).

### В проекте Node.js (Пример на стороне сервера)

```typescript
// main.ts (ваше серверное приложение)
import { createHtmlResource } from '@mcp-ui/server';

const myHtmlPayload = `<h1>Привет от Сервера!</h1><p>Временная метка: ${new Date().toISOString()}</p>`;

const resourceBlock = createHtmlResource({
  uri: 'ui://server-generated/item1',
  content: { type: 'rawHtml', htmlString: myHtmlPayload },
  delivery: 'text',
});


// Отправьте этот resourceBlock как часть вашего ответа MCP...
```

### В проекте React (Пример на стороне клиента)

```tsx
// App.tsx (ваше приложение React)
import React, { useState, useEffect } from 'react';
import { HtmlResource } from '@mcp-ui/client';

// Фиктивная структура ответа MCP
interface McpToolResponse {
  content: HtmlResource[];
}

function App() {
  const [mcpData, setMcpData] = useState<McpToolResponse | null>(null);

  // Симуляция получения данных MCP
  useEffect(() => {
    const fakeMcpResponse: McpToolResponse = {
      content: [
        {
          type: 'resource',
          resource: {
            uri: 'ui://client-example/dynamic-section',
            mimeType: 'text/html',
            text: '<h2>Динамический контент через MCP-UI</h2><button onclick="alert(\'Нажато!\')">Нажми меня</button>',
          },
        },
      ],
    };
    setMcpData(fakeMcpResponse);
  }, []);

  const handleResourceAction = async (
    tool: string,
    params: Record<string, unknown>,
  ) => {
    console.log(`Действие от ресурса (инструмент: ${tool}):`, params);
    // Добавьте вашу логику обработки (например, инициируйте последующий вызов инструмента)
    return { status: 'Действие получено клиентом' };
  };

  return (
    <div className="App">
      <h1>Клиентское приложение MCP</h1>
      {mcpData?.content.map((item, index) => {
        if (
          item.type === 'resource' &&
          item.resource.mimeType === 'text/html'
        ) {
          return (
            <div
              key={item.resource.uri || index}
              style={{
                border: '1px solid #eee',
                margin: '10px',
                padding: '10px',
              }}
            >
              <h3>Ресурс: {item.resource.uri}</h3>
              <HtmlResource
                resource={item.resource}
                onUiAction={handleResourceAction}
              />
            </div>
          );
        }
        return <p key={index}>Неподдерживаемый элемент контента</p>;
      })}
    </div>
  );
}

export default App;
```

Далее изучите конкретные руководства для каждого пакета SDK, чтобы узнать больше об их API и возможностях.

Чтобы собрать именно этот пакет из корня монорепозитория:

```bash
pnpm build -w @mcp-ui/server
```

Смотрите страницу [Использование Server SDK и Примеры](./server/usage-examples.md) для практических примеров.

Чтобы собрать именно этот пакет из корня монорепозитория:

```bash
pnpm build -w @mcp-ui/client
```

Смотрите следующие страницы для получения более подробной информации:

## Базовая настройка

Для серверов MCP убедитесь, что `@mcp-ui/server` доступен в вашем проекте Node.js. Если вы работаете вне этого монорепозитория, вы обычно устанавливаете их.


Для клиентов MCP убедитесь, что `@mcp-ui/client` и его одноранговые зависимости (`react` и потенциально `@modelcontextprotocol/sdk`) установлены в вашем проекте React.

```bash
pnpm add @mcp-ui/client react @modelcontextprotocol/sdk
```

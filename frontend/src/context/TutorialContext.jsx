import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import "../tutorial.css";

// eslint-disable-next-line react-refresh/only-export-components
export const TutorialContext = createContext(null);

const STORAGE_KEY = "innkeeper-tutorial-completed";

function readInitialCompleted() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STORAGE_KEY) === "true";
}

export function TutorialProvider({ children }) {
  const [isActive, setIsActive] = useState(false);
  const [completed, setCompleted] = useState(readInitialCompleted);
  const driverInstanceRef = useRef(null);

  const steps = useMemo(
    () => [
      {
        element: '[data-tutorial="header-options"]',
        popover: {
          title: "Botão de Opções",
          description:
            "Acesse aqui as principais ações: criar nova ficha, importar e exportar JSONs, e reiniciar este tutorial a qualquer momento.",
        },
      },
      {
        element: '[data-tutorial="sheet-list"]',
        popover: {
          title: "Minhas Fichas",
          description:
            "Todas as suas fichas de personagem aparecem aqui. Clique em uma para abrir e editar. As fichas são salvas automaticamente enquanto você edita.",
        },
      },
      {
        element: '[data-tutorial="empty-state"]',
        popover: {
          title: "Criar primeira ficha",
          description:
            "Você ainda não tem fichas. Use o botão 'Criar primeira ficha' ou o menu de opções acima para começar. Você também pode importar fichas exportadas anteriormente.",
          side: "top",
        },
      },
      {
        element: '[data-tutorial="system-cards"]',
        popover: {
          title: "Escolha o Sistema",
          description:
            "Selecione o sistema de RPG para sua ficha: D&D 5e (d20 clássico), Pathfinder 2e (d20 com mais opções táticas) ou Daggerheart (dados duais Hope/Fear, foco em narrativa).",
          side: "bottom",
        },
      },
      {
        element: '[data-tutorial="sheet-name"]',
        popover: {
          title: "Nome do Personagem",
          description:
            "Digite o nome do seu personagem aqui. Você pode mudar depois diretamente na ficha.",
        },
      },
      {
        element: '[data-tutorial="sheet-content"]',
        popover: {
          title: "Ficha do Personagem",
          description:
            "Aqui ficam todos os dados do personagem: atributos, HP, CA, habilidades e mais. Tudo é salvo automaticamente — procure o indicador 'Salvando' no topo quando houver alterações.",
          side: "top",
        },
      },
      {
        element: '[data-tutorial="sheet-export"]',
        popover: {
          title: "Exportar a Ficha",
          description:
            "Acesse o menu de opções no topo para exportar sua ficha: 'Exportar JSON' salva no formato nativo do InnKeeper; 'Exportar para Booker' gera um arquivo compatível com o Tracker do mestre.",
          side: "bottom",
        },
      },
    ],
    []
  );

  const startTutorial = useCallback(() => {
    setIsActive(true);
    setCompleted(false);

    if (driverInstanceRef.current) {
      driverInstanceRef.current.destroy();
    }

    const runtimeSteps = steps.filter((step) => {
      if (!step.element) return true;
      try {
        return Boolean(document.querySelector(step.element));
      } catch {
        return false;
      }
    });

    if (runtimeSteps.length === 0) {
      setIsActive(false);
      return;
    }

    driverInstanceRef.current = driver({
      showProgress: true,
      showButtons: ["previous", "next", "close"],
      allowClose: true,
      allowKeyboardControl: true,
      overlayClickBehavior: "close",
      steps: runtimeSteps,
      onDestroyed: () => {
        setIsActive(false);
        setCompleted(true);
        try {
          window.localStorage.setItem(STORAGE_KEY, "true");
        } catch {
          // localStorage indisponível
        }
      },
    });

    driverInstanceRef.current.drive();
  }, [steps]);

  const skipTutorial = useCallback(() => {
    if (driverInstanceRef.current) {
      driverInstanceRef.current.destroy();
    }
    setIsActive(false);
    setCompleted(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // localStorage indisponível
    }
  }, []);

  const resetTutorial = useCallback(() => {
    setCompleted(false);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // localStorage indisponível
    }
  }, []);

  useEffect(() => {
    return () => {
      if (driverInstanceRef.current) {
        driverInstanceRef.current.destroy();
      }
    };
  }, []);

  const value = useMemo(
    () => ({ isActive, completed, startTutorial, skipTutorial, resetTutorial }),
    [isActive, completed, startTutorial, skipTutorial, resetTutorial]
  );

  return <TutorialContext.Provider value={value}>{children}</TutorialContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTutorial() {
  return useContext(TutorialContext);
}

export const Dictionary = {
    // English (Source/Fallback) can be kept here or just implied. 
    // We will use PT-BR as the active Return.

    header: {
        title: "Gestão Acadêmica",
        subtitle: "Agendamento inteligente e alocação de recursos para Escolas de Medicina.",
        statusSystem: "Status do Sistema",
        statusConnecting: "Conectando...",
        statusConnected: "Conectado",
        statusError: "Erro de Conexão",
        statusMissingEnv: "Configuração Necessária (Variáveis de Ambiente faltando)",
        inspector: "Inspetor de Dados",
        syncNow: "Sincronizar Agora"
    },
    board: {
        tabs: {
            board: "Quadro de Horários",
            calendar: "Calendário 2026"
        },
        actions: {
            save: "Salvar Horários",
            saving: "Salvando...",
            autoFill: "✨ Preenchimento Automático",
            backToEdit: "Voltar para Edição"
        },
        groups: {
            all: "Todos",
            general: "Geral"
        },
        sidebar: {
            title: "Disciplinas Pendentes",
            empty: "Tudo agendado! 🎉"
        },
        confirm: {
            autoSchedule: "O Preenchimento Automático tentará alocar as aulas nos espaços vazios. Continuar?",
            saveSuccess: "Horários salvos com sucesso!",
            saveError: "Erro ao salvar horários.",
            optimizeSuccess: "Agendamento otimizado com sucesso!",
            optimizeConflict: "Agendado com conflitos:"
        }
    },
    calendar: {
        views: {
            month: "Mês",
            week: "Semana",
            day: "Dia",
            agenda: "Agenda"
        },
        headers: {
            today: "Hoje",
            previous: "Anterior",
            next: "Próximo"
        }
    },
    days: {
        Monday: "Segunda-feira",
        Tuesday: "Terça-feira",
        Wednesday: "Quarta-feira",
        Thursday: "Quinta-feira",
        Friday: "Sexta-feira"
    },
    editor: {
        title: "Editar Disciplina",
        subtitle: "Configure o plano de ensino e restrições.",
        fields: {
            name: "Nome da Disciplina",
            code: "Código",
            workloadType: "Tipo de Carga",
            totalLoad: "Carga Horária (h)",
            professors: "Professores (separados por vírgula)"
        },
        syllabus: {
            title: "Plano de Aulas",
            addLesson: "Adicionar Aula",
            empty: "Nenhuma aula definida ainda.",
            lessonPlaceholder: "Tema da aula...",
            order: "Aula"
        },
        actions: {
            save: "Salvar Alterações",
            saving: "Salvando...",
            cancel: "Cancelar"
        }
    }
};

export type LanguageKey = keyof typeof Dictionary;

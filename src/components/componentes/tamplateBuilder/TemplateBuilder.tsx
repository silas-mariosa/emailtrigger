'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ChevronUp, ChevronDown, Trash2, Settings, Plus, AlignHorizontalJustifyCenterIcon, AlignVerticalJustifyCenterIcon } from 'lucide-react'

type ComponentType = 'container' | 'title' | 'paragraph' | 'image' | 'button'
type AlignmentType = 'row' | 'column'

interface BaseComponent {
  id: string;
  type: ComponentType;
  content: string;
  style: {
    color: string;
    fontFamily: string;
    fontSize: string;
    textAlign: 'left' | 'center' | 'right';
    backgroundColor?: string;
    width?: string;
    height?: string;
    link?: string;
    bold?: boolean;
    underline?: boolean;
  };
}

interface ContainerComponent extends BaseComponent {
  type: 'container';
  children: EmailComponent[];
  alignment: AlignmentType;
  backgroundColor: string;
}

interface TitleComponent extends BaseComponent {
  type: 'title';
}

interface ParagraphComponent extends BaseComponent {
  type: 'paragraph';
}

interface ImageComponent extends BaseComponent {
  type: 'image';
}

interface ButtonComponent extends BaseComponent {
  type: 'button';
}

type EmailComponent = ContainerComponent | TitleComponent | ParagraphComponent | ImageComponent | ButtonComponent;

interface EmailTemplate {
  subject: string;
  recipient: string;
  components: EmailComponent[];
  style: {
    backgroundColor: string;
    textAlign: 'left' | 'center' | 'right';
    footerText: string;
  };
}

const fontOptions = ['Arial', 'Helvetica', 'Times New Roman', 'Courier', 'Verdana', 'Georgia']
const fontSizeOptions = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px']

export default function EmailTemplateEditor() {
  const [template, setTemplate] = useState<EmailTemplate>({
    subject: '',
    recipient: '',
    components: [],
    style: {
      backgroundColor: '#ffffff',
      textAlign: 'left',
      footerText: '© 2023 Sua Empresa. Todos os direitos reservados.'
    }
  })

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const createNewComponent = (type: ComponentType, content: string = ''): EmailComponent => {
    const baseComponent: BaseComponent = {
      id: generateId(),
      type,
      content,
      style: {
        color: '#000000',
        fontFamily: 'Arial',
        fontSize: '16px',
        textAlign: 'left',
        bold: false,
        underline: false,
      }
    };

    switch (type) {
      case 'container':
        return { ...baseComponent, children: [], alignment: 'column', backgroundColor: '#ffffff' } as ContainerComponent;
      case 'button':
        return { ...baseComponent, style: { ...baseComponent.style, backgroundColor: '#007bff', link: '#' } } as ButtonComponent;
      case 'image':
        return { ...baseComponent, style: { ...baseComponent.style, width: '100%', height: 'auto' } } as ImageComponent;
      case 'title':
        return { ...baseComponent } as TitleComponent;
      case 'paragraph':
        return { ...baseComponent } as ParagraphComponent;
    }
  }

  const handleAddComponent = (type: ComponentType, parentId: string | null = null) => {
    setTemplate(prev => {
      const newComponent = createNewComponent(type);
      if (!parentId) {
        return { ...prev, components: [...prev.components, newComponent] };
      } else {
        return {
          ...prev,
          components: prev.components.map(component => 
            component.id === parentId && component.type === 'container' && (component as ContainerComponent).children.length < 4
              ? { ...component, children: [...(component as ContainerComponent).children, newComponent] }
              : component
          ) as EmailComponent[]
        };
      }
    });
  }

  const handleUpdateComponent = (id: string, updates: Partial<EmailComponent>, parentId: string | null = null) => {
    setTemplate(prev => {
      const updateComponent = (components: EmailComponent[]): EmailComponent[] => 
        components.map(component => {
          if (component.id === id) {
            return { ...component, ...updates } as EmailComponent;
          }
          if (component.type === 'container') {
            return { ...component, children: updateComponent(component.children) } as ContainerComponent;
          }
          return component;
        });

      if (!parentId) {
        return { ...prev, components: updateComponent(prev.components) };
      } else {
        return {
          ...prev,
          components: prev.components.map(component => 
            component.id === parentId && component.type === 'container'
              ? { ...component, children: updateComponent(component.children) }
              : component
          ) as EmailComponent[]
        };
      }
    });
  }

  const handleDeleteComponent = (id: string, parentId: string | null = null) => {
    setTemplate(prev => {
      const deleteFromArray = (components: EmailComponent[]): EmailComponent[] => 
        components.filter(component => {
          if (component.id === id) return false;
          if (component.type === 'container') {
            return { ...component, children: deleteFromArray(component.children) } as ContainerComponent;
          }
          return true;
        });

      if (!parentId) {
        return { ...prev, components: deleteFromArray(prev.components) };
      } else {
        return {
          ...prev,
          components: prev.components.map(component => 
            component.id === parentId && component.type === 'container'
              ? { ...component, children: deleteFromArray(component.children) }
              : component
          ) as EmailComponent[]
        };
      }
    });
  }

  const handleMoveComponent = (id: string, direction: 'up' | 'down', parentId: string | null = null) => {
    setTemplate(prev => {
      const moveInArray = (components: EmailComponent[]): EmailComponent[] => {
        const index = components.findIndex(component => component.id === id);
        if (index === -1) return components;
        if ((direction === 'up' && index === 0) || (direction === 'down' && index === components.length - 1)) {
          return components;
        }
        const newComponents = [...components];
        const [removed] = newComponents.splice(index, 1);
        newComponents.splice(direction === 'up' ? index - 1 : index + 1, 0, removed);
        return newComponents;
      };

      if (!parentId) {
        return { ...prev, components: moveInArray(prev.components) };
      } else {
        return {
          ...prev,
          components: prev.components.map(component => 
            component.id === parentId && component.type === 'container'
              ? { ...component, children: moveInArray(component.children) }
              : component
          ) as EmailComponent[]
        };
      }
    });
  }

  const renderComponentEditor = (component: EmailComponent, parentId: string | null = null) => {
    const { id, type, content, style } = component;
    const commonProps = {
      style: {
        color: style.color,
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        textAlign: style.textAlign,
        fontWeight: style.bold ? 'bold' : 'normal',
        textDecoration: style.underline ? 'underline' : 'none',
      }
    };

    const componentContent = (() => {
      switch (type) {
        case 'container':
          return (
            <div className="border-2 border-dashed border-gray-300 p-4 my-4" style={{ backgroundColor: (component as ContainerComponent).backgroundColor }}>
              <h3 className="text-lg font-semibold mb-2">Container</h3>
              <div className={`flex ${(component as ContainerComponent).alignment === 'row' ? 'flex-row' : 'flex-col'} gap-4`}>
                {(component as ContainerComponent).children.map(child => (
                  <div key={child.id} className="flex-1">
                    {renderComponentEditor(child, id)}
                  </div>
                ))}
              </div>
              {(component as ContainerComponent).children.length < 4 && (
                <div className="mt-2 flex gap-2">
                  <Button onClick={() => handleAddComponent('title', id)} size="sm">
                    <Plus className="mr-2 h-4 w-4" /> Título
                  </Button>
                  <Button onClick={() => handleAddComponent('paragraph', id)} size="sm">
                    <Plus className="mr-2 h-4 w-4" /> Parágrafo
                  </Button>
                  <Button onClick={() => handleAddComponent('image', id)} size="sm">
                    <Plus className="mr-2 h-4 w-4" /> Imagem
                  </Button>
                  <Button onClick={() => handleAddComponent('button', id)} size="sm">
                    <Plus className="mr-2 h-4 w-4" /> Botão
                  </Button>
                </div>
              )}
            </div>
          );
        case 'title':
          return <h2 {...commonProps} className="font-bold my-2">{content}</h2>;
        case 'paragraph':
          return <p {...commonProps} className="my-2">{content}</p>;
        case 'image':
          return (
            <div className='flex flex-col justify-center'>
              <img src={content} alt="Conteúdo do email" style={{ width: style.width, height: style.height }} className="my-2" />
            </div>
          );
        case 'button':
          return (
            <div style={{ textAlign: style.textAlign }}>
              <a href={style.link} target="_blank" rel="noopener noreferrer">
                <button style={{ ...commonProps.style, backgroundColor: style.backgroundColor }} className="px-4 py-2 rounded my-4 text-white">
                  {content}
                </button>
              </a>
            </div>
          );
        default:
          return null;
      }
    })();

    return (
      <div key={id} className="relative group border p-2 my-2">
        {componentContent}
        <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon"><Settings className="h-4 w-4" /></Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="grid gap-4">
                {type !== 'container' && (
                  <div className="space-y-2">
                    <Label htmlFor={`content-${id}`}>Conteúdo</Label>
                    {type === 'paragraph' ? (
                      <Textarea
                        id={`content-${id}`}
                        value={content}
                        onChange={(e) => handleUpdateComponent(id, { content: e.target.value }, parentId)}
                        placeholder="Conteúdo do parágrafo"
                        rows={4}
                      />
                    ) : (
                      <Input
                        id={`content-${id}`}
                        value={content}
                        onChange={(e) => handleUpdateComponent(id, { content: e.target.value }, parentId)}
                        placeholder={type === 'image' ? 'URL da imagem' : 'Conteúdo do componente'}
                      />
                    )}
                  </div>
                )}
                {type === 'container' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor={`alignment-${id}`}>Alinhamento</Label>
                      <Select
                        onValueChange={(value: AlignmentType) => 
                          handleUpdateComponent(id, { alignment: value } as Partial<ContainerComponent>, parentId)
                        }
                        defaultValue={(component as ContainerComponent).alignment}
                      >
                        <SelectTrigger id={`alignment-${id}`}>
                          <SelectValue placeholder="Selecione o alinhamento" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="row">
                            <div className="flex items-center">
                              <AlignHorizontalJustifyCenterIcon className="mr-2 h-4 w-4" />
                              Em linha
                            </div>
                          </SelectItem>
                          <SelectItem value="column">
                            <div className="flex items-center">
                              <AlignVerticalJustifyCenterIcon className="mr-2 h-4 w-4" />
                              Em coluna
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`bg-color-${id}`}>Cor de Fundo do Container</Label>
                      <Input
                        id={`bg-color-${id}`}
                        type="color"
                        value={(component as ContainerComponent).backgroundColor}
                        onChange={(e) => handleUpdateComponent(id, { backgroundColor: e.target.value } as Partial<ContainerComponent>, parentId)}
                      />
                    </div>
                  </>
                )}
                {type !== 'image' && type !== 'container' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor={`color-${id}`}>Cor do Texto</Label>
                      <Input
                        
                        id={`color-${id}`}
                        type="color"
                        value={style.color}
                        onChange={(e) => handleUpdateComponent(id, { style: { ...style, color: e.target.value } }, parentId)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`font-${id}`}>Fonte</Label>
                      <Select
                        onValueChange={(value) => handleUpdateComponent(id, { style: { ...style, fontFamily: value } }, parentId)}
                        defaultValue={style.fontFamily}
                      >
                        <SelectTrigger id={`font-${id}`}>
                          <SelectValue placeholder="Selecione uma fonte" />
                        </SelectTrigger>
                        <SelectContent>
                          {fontOptions.map((font) => (
                            <SelectItem key={font} value={font}>{font}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`font-size-${id}`}>Tamanho da Fonte</Label>
                      <Select
                        onValueChange={(value) => handleUpdateComponent(id, { style: { ...style, fontSize: value } }, parentId)}
                        defaultValue={style.fontSize}
                      >
                        <SelectTrigger id={`font-size-${id}`}>
                          <SelectValue placeholder="Selecione um tamanho" />
                        </SelectTrigger>
                        <SelectContent>
                          {fontSizeOptions.map((size) => (
                            <SelectItem key={size} value={size}>{size}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <Label htmlFor={`align-${id}`}>Alinhamento</Label>
                  <Select
                    onValueChange={(value: 'left' | 'center' | 'right') => handleUpdateComponent(id, { style: { ...style, textAlign: value } }, parentId)}
                    defaultValue={style.textAlign}
                  >
                    <SelectTrigger id={`align-${id}`}>
                      <SelectValue placeholder="Selecione o alinhamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Esquerda</SelectItem>
                      <SelectItem value="center">Centro</SelectItem>
                      <SelectItem value="right">Direita</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {type === 'button' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor={`link-${id}`}>Link</Label>
                      <Input
                        id={`link-${id}`}
                        type="url"
                        value={style.link}
                        onChange={(e) => handleUpdateComponent(id, { style: { ...style, link: e.target.value } }, parentId)}
                        placeholder="https://exemplo.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`bg-color-${id}`}>Cor de Fundo</Label>
                      <Input
                        id={`bg-color-${id}`}
                        type="color"
                        value={style.backgroundColor}
                        onChange={(e) => handleUpdateComponent(id, { style: { ...style, backgroundColor: e.target.value } }, parentId)}
                      />
                    </div>
                  </>
                )}
                {type === 'image' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor={`width-${id}`}>Largura</Label>
                      <Input
                        id={`width-${id}`}
                        type="text"
                        value={style.width}
                        onChange={(e) => handleUpdateComponent(id, { style: { ...style, width: e.target.value } }, parentId)}
                        placeholder="100%, 300px, etc."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`height-${id}`}>Altura</Label>
                      <Input
                        id={`height-${id}`}
                        type="text"
                        value={style.height}
                        onChange={(e) => handleUpdateComponent(id, { style: { ...style, height: e.target.value } }, parentId)}
                        placeholder="auto, 200px, etc."
                      />
                    </div>
                  </>
                )}
              </div>
            </PopoverContent>
          </Popover>
          <Button variant="ghost" size="icon" onClick={() => handleMoveComponent(id, 'up', parentId)}><ChevronUp className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => handleMoveComponent(id, 'down', parentId)}><ChevronDown className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => handleDeleteComponent(id, parentId)}><Trash2 className="h-4 w-4" /></Button>
        </div>
      </div>
    );
  }

  const generateEmailHtml = (template: EmailTemplate): string => {
    const { subject, recipient, components, style } = template;

    const renderComponent = (component: EmailComponent): string => {
      const { type, content, style } = component;
      const commonStyle = `
        color: ${style.color};
        font-family: ${style.fontFamily};
        font-size: ${style.fontSize};
        text-align: ${style.textAlign};
        ${style.bold ? 'font-weight: bold;' : ''}
        ${style.underline ? 'text-decoration: underline;' : ''}
      `;

      switch (type) {
        case 'container':
          return `
            <div style="background-color: ${(component as ContainerComponent).backgroundColor}; padding: 10px; margin: 10px 0;">
              ${(component as ContainerComponent).children.map(renderComponent).join('')}
            </div>
          `;
        case 'title':
          return `<h2 style="${commonStyle}">${content}</h2>`;
        case 'paragraph':
          return `<p style="${commonStyle}">${content}</p>`;
        case 'image':
          return `<img src="${content}" alt="Email content" style="width: ${style.width}; height: ${style.height};" />`;
        case 'button':
          return `
            <a href="${style.link}" style="text-decoration: none;">
              <button style="${commonStyle} background-color: ${style.backgroundColor}; border: none; padding: 10px 20px; cursor: pointer;">
                ${content}
              </button>
            </a>
          `;
        default:
          return '';
      }
    };

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="background-color: ${style.backgroundColor}; margin: 0; padding: 20px; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
          ${components.map(renderComponent).join('')}
          <footer style="margin-top: 20px; text-align: center; font-size: 12px; color: #666;">
            ${style.footerText}
          </footer>
        </div>
      </body>
      </html>
    `;
  };

  const handleSave = () => {
    console.log('Template salvo:', template);
    const htmlContent = generateEmailHtml(template);
    console.log('HTML gerado:', htmlContent);
    // Aqui você pode implementar a lógica para salvar o template ou enviar o HTML
  }

  return (
    <div className="container mx-auto p-2">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Editor de Template de E-mail Marketing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Assunto</Label>
            <Input
              id="subject"
              value={template.subject}
              onChange={(e) => setTemplate(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Digite o assunto do e-mail"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="recipient">Destinatário</Label>
            <Input
              id="recipient"
              value={template.recipient}
              onChange={(e) => setTemplate(prev => ({ ...prev, recipient: e.target.value }))}
              placeholder="Digite o e-mail do destinatário"
              type="email"
            />
          </div>
          <div className="space-y-2">
            <Label>Adicionar Componente</Label>
            <div className="flex space-x-2">
              <Button onClick={() => handleAddComponent('container')}>Adicionar Container</Button>
              <Button onClick={() => handleAddComponent('title')}>Adicionar Título</Button>
              <Button onClick={() => handleAddComponent('paragraph')}>Adicionar Parágrafo</Button>
              <Button onClick={() => handleAddComponent('image')}>Adicionar Imagem</Button>
              <Button onClick={() => handleAddComponent('button')}>Adicionar Botão</Button>
            </div>
          </div>
          <div className="border p-4 min-h-[200px]" style={{ backgroundColor: template.style.backgroundColor, textAlign: template.style.textAlign }}>
            <h3 className="text-lg font-semibold mb-2">Prévia do E-mail:</h3>
            {template.components.map(component => renderComponentEditor(component))}
            <footer className="mt-4 text-sm text-gray-500">{template.style.footerText}</footer>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">Configurações Gerais</Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email-bg-color">Cor de Fundo do E-mail</Label>
                  <Input
                    id="email-bg-color"
                    type="color"
                    value={template.style.backgroundColor}
                    onChange={(e) => setTemplate(prev => ({ ...prev, style: { ...prev.style, backgroundColor: e.target.value } }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-align">Alinhamento Geral</Label>
                  <Select
                    onValueChange={(value: 'left' | 'center' | 'right') => setTemplate(prev => ({ ...prev, style: { ...prev.style, textAlign: value } }))}
                    defaultValue={template.style.textAlign}
                  >
                    <SelectTrigger id="email-align">
                      <SelectValue placeholder="Selecione o alinhamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Esquerda</SelectItem>
                      <SelectItem value="center">Centro</SelectItem>
                      <SelectItem value="right">Direita</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="footer-text">Texto do Rodapé</Label>
                  <Input
                    id="footer-text"
                    value={template.style.footerText}
                    onChange={(e) => setTemplate(prev => ({ ...prev, style: { ...prev.style, footerText: e.target.value } }))}
                    placeholder="Digite o texto do rodapé"
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSave} className="w-full">Salvar Template</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ChevronUp, ChevronDown, Trash2, Settings, Plus, AlignHorizontalJustifyCenterIcon, AlignVerticalJustifyCenterIcon, Link } from 'lucide-react'

type ComponentType = 'container' | 'title' | 'paragraph' | 'image' | 'button'
type AlignmentType = 'row' | 'column'

interface BaseComponent {
  id: string;
  type: ComponentType;
  content: string | (string | TextLink)[];
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
    italic?: boolean;
    underline?: boolean;
    padding: string;
    margin: string;
    borderRadius: string;
  };
}

interface ContainerComponent extends BaseComponent {
  type: 'container';
  children: EmailComponent[];
  alignment: AlignmentType;
  backgroundColor: string;
  itemsCenter: boolean;
}

interface TitleComponent extends BaseComponent {
  type: 'title';
}

interface TextLink {
  id: string;
  text: string;
  url: string;
  style: {
    color: string;
    fontFamily: string;
    fontSize: string;
    bold: boolean;
    italic: boolean;
    underline: boolean;
  };
}

interface ParagraphComponent extends BaseComponent {
  type: 'paragraph';
  itemsCenter?: boolean;
  content: (string | TextLink)[];
}

interface ImageComponent extends BaseComponent {
  type: 'image';
}

interface ButtonComponent extends BaseComponent {
  type: 'button';
}

type EmailComponent = ContainerComponent | TitleComponent | ParagraphComponent | ImageComponent | ButtonComponent;

interface EmailTemplate {
  id?: string;
  subject: string;
  recipient: string;
  components: EmailComponent[];
  style: {
    backgroundColor: string;
    textAlign: 'left' | 'center' | 'right';
    footerText: string;
  };
}

interface TextElement {
  id: string;
  type: 'text';
  content: string;
  style: TextStyle;
}

interface LinkElement {
  id: string;
  type: 'link';
  content: string;
  url: string;
  style: TextStyle;
}

type ParagraphElement = TextElement | LinkElement;

interface TextStyle {
  color: string;
  fontFamily: string;
  fontSize: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
}

interface ParagraphComponent extends BaseComponent {
  type: 'paragraph';
  itemsCenter?: boolean;
  elements: ParagraphElement[];
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
  const [savedTemplates, setSavedTemplates] = useState<EmailTemplate[]>([]);
  const [currentTemplateId, setCurrentTemplateId] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>('');

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const createNewComponent = (type: ComponentType, content: string = ''): EmailComponent => {
    const baseComponent: BaseComponent = {
      id: generateId(),
      type,
      content: '',
      style: {
        color: '#000000',
        fontFamily: 'Arial',
        fontSize: '16px',
        textAlign: 'left',
        bold: false,
        italic: false,
        underline: false,
        padding: '0px',
        margin: '0px',
        borderRadius: '0px',
      }
    };

    switch (type) {
      case 'container':
        return { ...baseComponent, content: [], children: [], alignment: 'column', backgroundColor: '#ffffff', itemsCenter: false } as ContainerComponent;
      case 'button':
        return { ...baseComponent, content: '', style: { ...baseComponent.style, backgroundColor: '#007bff', link: '#' } } as ButtonComponent;
      case 'image':
        return { ...baseComponent, content: '', style: { ...baseComponent.style, width: '100%', height: 'auto' } } as ImageComponent;
      case 'title':
        return { ...baseComponent, content: '' } as TitleComponent;
      case 'paragraph':
        return { ...baseComponent, content: [] } as ParagraphComponent;
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

  const handleAddTextElement = (paragraphId: string, parentId: string | null = null) => {
    setTemplate(prev => {
      const updateComponent = (components: EmailComponent[]): EmailComponent[] =>
        components.map(component => {
          if (component.id === paragraphId && component.type === 'paragraph') {
            const newElement: TextElement = {
              id: generateId(),
              type: 'text',
              content: 'Novo texto',
              style: {
                color: '#000000',
                fontFamily: 'Arial',
                fontSize: '16px',
                bold: false,
                italic: false,
                underline: false,
              }
            };
            return {
              ...component,
              elements: [...component.elements, newElement]
            } as ParagraphComponent;
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

  const handleAddLinkElement = (paragraphId: string, parentId: string | null = null) => {
    setTemplate(prev => {
      const updateComponent = (components: EmailComponent[]): EmailComponent[] =>
        components.map(component => {
          if (component.id === paragraphId && component.type === 'paragraph') {
            const newElement: LinkElement = {
              id: generateId(),
              type: 'link',
              content: 'Novo Link',
              url: '#',
              style: {
                color: '#0000FF',
                fontFamily: 'Arial',
                fontSize: '16px',
                bold: false,
                italic: false,
                underline: true,
              }
            };
            return {
              ...component,
              elements: [...component.elements, newElement]
            } as ParagraphComponent;
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

  const handleUpdateParagraphElement = (
    paragraphId: string,
    elementId: string,
    updates: Partial<ParagraphElement>,
    parentId: string | null = null
  ) => {
    setTemplate(prev => {
      const updateComponent = (components: EmailComponent[]): EmailComponent[] =>
        components.map(component => {
          if (component.id === paragraphId && component.type === 'paragraph') {
            return {
              ...component,
              elements: component.elements.map(element =>
                element.id === elementId ? { ...element, ...updates } : element
              )
            } as ParagraphComponent;
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

  const handleAddTextLink = (paragraphId: string, parentId: string | null = null) => {
    setTemplate(prev => {
      const updateComponent = (components: EmailComponent[]): EmailComponent[] =>
        components.map(component => {
          if (component.id === paragraphId && component.type === 'paragraph') {
            const newLink: TextLink = {
              id: generateId(),
              text: 'Novo Link',
              url: '#',
              style: {
                color: '#0000FF',
                fontFamily: 'inherit',
                fontSize: 'inherit',
                bold: false,
                italic: false,
                underline: true,
              }
            };
            return {
              ...component,
              content: [...component.content, newLink]
            } as ParagraphComponent;
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

  const handleUpdateTextLink = (paragraphId: string, linkId: string, updates: Partial<TextLink>, parentId: string | null = null) => {
    setTemplate(prev => {
      const updateComponent = (components: EmailComponent[]): EmailComponent[] =>
        components.map(component => {
          if (component.id === paragraphId && component.type === 'paragraph') {
            return {
              ...component,
              content: component.content.map(item =>
                typeof item !== 'string' && item.id === linkId ? { ...item, ...updates } : item
              )
            } as ParagraphComponent;
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

  const handleAddText = (paragraphId: string, parentId: string | null = null) => {
    setTemplate(prev => {
      const updateComponent = (components: EmailComponent[]): EmailComponent[] =>
        components.map(component => {
          if (component.id === paragraphId && component.type === 'paragraph') {
            return {
              ...component,
              content: [...component.content, 'Novo texto']
            } as ParagraphComponent;
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


  const renderComponentEditor = (component: EmailComponent, parentId: string | null = null) => {
    const { id, type, content, style } = component;
    const commonProps = {
      style: {
        color: style.color,
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        textAlign: style.textAlign,
        fontWeight: style.bold ? 'bold' : 'normal',
        fontStyle: style.italic ? 'italic' : 'normal',
        textDecoration: style.underline ? 'underline' : 'none',
        padding: style.padding,
        margin: style.margin,
        borderRadius: style.borderRadius,
        backgroundColor: style.backgroundColor,
      }
    };

    const componentContent = (() => {
      switch (type) {
        case 'container':
          return (
            <div className={`border-2 border-dashed border-gray-300 p-4 my-4 ${(component as ContainerComponent).itemsCenter ? 'items-center' : ''}`} style={{ backgroundColor: (component as ContainerComponent).backgroundColor }}>
              <h3 className="text-lg font-semibold mb-2">Container</h3>
              <div className={`flex ${(component as ContainerComponent).alignment === 'row' ? 'flex-row' : 'flex-col'} gap-4 ${(component as ContainerComponent).itemsCenter ? 'items-center' : ''}`}>
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
          const paragraphComponent = component as ParagraphComponent;
          return (
            <div {...commonProps} className={`my-2 ${paragraphComponent.itemsCenter ? 'text-center' : ''}`}>
              {paragraphComponent.elements.map((element, index) => (
                <span key={element.id}>
                  {element.type === 'text' ? (
                    <span style={{
                      color: element.style.color,
                      fontFamily: element.style.fontFamily,
                      fontSize: element.style.fontSize,
                      fontWeight: element.style.bold ? 'bold' : 'normal',
                      fontStyle: element.style.italic ? 'italic' : 'normal',
                      textDecoration: element.style.underline ? 'underline' : 'none',
                    }}>
                      {element.content}
                    </span>
                  ) : (
                    <a href={element.url} style={{
                      color: element.style.color,
                      fontFamily: element.style.fontFamily,
                      fontSize: element.style.fontSize,
                      fontWeight: element.style.bold ? 'bold' : 'normal',
                      fontStyle: element.style.italic ? 'italic' : 'normal',
                      textDecoration: element.style.underline ? 'underline' : 'none',
                    }}>
                      {element.content}
                    </a>
                  )}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm"><Settings className="h-4 w-4" /></Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="grid gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`element-content-${element.id}`}>Conteúdo</Label>
                          <Input
                            id={`element-content-${element.id}`}
                            value={element.content}
                            onChange={(e) => handleUpdateParagraphElement(id, element.id, { content: e.target.value }, parentId)}
                          />
                        </div>
                        {element.type === 'link' && (
                          <div className="space-y-2">
                            <Label htmlFor={`element-url-${element.id}`}>URL</Label>
                            <Input
                              id={`element-url-${element.id}`}
                              value={element.url}
                              onChange={(e) => handleUpdateParagraphElement(id, element.id, { url: e.target.value }, parentId)}
                            />
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label htmlFor={`element-color-${element.id}`}>Cor</Label>
                          <Input
                            id={`element-color-${element.id}`}
                            type="color"
                            value={element.style.color}
                            onChange={(e) => handleUpdateParagraphElement(id, element.id, { style: { ...element.style, color: e.target.value } }, parentId)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`element-font-${element.id}`}>Fonte</Label>
                          <Select
                            onValueChange={(value) => handleUpdateParagraphElement(id, element.id, { style: { ...element.style, fontFamily: value } }, parentId)}
                            defaultValue={element.style.fontFamily}
                          >
                            <SelectTrigger id={`element-font-${element.id}`}>
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
                          <Label htmlFor={`element-font-size-${element.id}`}>Tamanho da Fonte</Label>
                          <Select
                            onValueChange={(value) => handleUpdateParagraphElement(id, element.id, { style: { ...element.style, fontSize: value } }, parentId)}
                            defaultValue={element.style.fontSize}
                          >
                            <SelectTrigger id={`element-font-size-${element.id}`}>
                              <SelectValue placeholder="Selecione um tamanho" />
                            </SelectTrigger>
                            <SelectContent>
                              {fontSizeOptions.map((size) => (
                                <SelectItem key={size} value={size}>{size}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant={element.style.bold ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleUpdateParagraphElement(id, element.id, { style: { ...element.style, bold: !element.style.bold } }, parentId)}
                          >
                            B
                          </Button>
                          <Button
                            variant={element.style.italic ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleUpdateParagraphElement(id, element.id, { style: { ...element.style, italic: !element.style.italic } }, parentId)}
                          >
                            I
                          </Button>
                          <Button
                            variant={element.style.underline ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleUpdateParagraphElement(id, element.id, { style: { ...element.style, underline: !element.style.underline } }, parentId)}
                          >
                            U
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </span>
              ))}
              <div className="mt-2">
                <Button onClick={() => handleAddTextElement(id, parentId)} size="sm" variant="outline">
                  <Plus className="mr-2 h-4 w-4" /> Adicionar Texto
                </Button>
                <Button onClick={() => handleAddLinkElement(id, parentId)} size="sm" variant="outline">
                  <Plus className="mr-2 h-4 w-4" /> Adicionar Link
                </Button>
              </div>
            </div>
          );
        case 'image':
          return (
            <div className='flex flex-col justify-center'>
              <img src={content as string} alt="Conteúdo do email" style={{ width: style.width, height: style.height }} className="my-2" />
            </div>
          );
        case 'button':
          return (
            <div style={{ textAlign: style.textAlign }}>
              <a href={style.link} target="_blank" rel="noopener noreferrer">
                <button {...commonProps} className="px-4 py-2 rounded my-4 text-white">
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
      <div key={id} className="relative  group border p-2 my-2" style={commonProps.style}>
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
                        value={content as string}
                        onChange={(e) => handleUpdateComponent(id, { content: e.target.value }, parentId)}
                        placeholder="Conteúdo do parágrafo"
                        rows={4}
                      />
                    ) : (
                      <Input
                        id={`content-${id}`}
                        value={content as string}
                        onChange={(e) => handleUpdateComponent(id, { content: e.target.value }, parentId)}
                        placeholder={type === 'image' ? 'URL da imagem' : 'Conteúdo do componente'}
                      />
                    )}
                  </div>
                )}
                {type === 'paragraph' && (component as ParagraphComponent).content
                  .filter((item): item is TextLink => typeof item !== 'string')
                  .map(link => (
                    <div key={link.id} className="space-y-2">
                      <Label htmlFor={`link-text-${link.id}`}>Texto do Link</Label>
                      <Input
                        id={`link-text-${link.id}`}
                        value={link.text}
                        onChange={(e) => handleUpdateTextLink(id, link.id, { text: e.target.value }, parentId)}
                      />
                      <Label htmlFor={`link-url-${link.id}`}>URL do Link</Label>
                      <Input
                        id={`link-url-${link.id}`}
                        value={link.url}
                        onChange={(e) => handleUpdateTextLink(id, link.id, { url: e.target.value }, parentId)}
                      />
                      <Label htmlFor={`link-color-${link.id}`}>Cor do Link</Label>
                      <Input
                        id={`link-color-${link.id}`}
                        type="color"
                        value={link.style.color}
                        onChange={(e) => handleUpdateTextLink(id, link.id, { style: { ...link.style, color: e.target.value } }, parentId)}
                      />
                      <Label htmlFor={`link-font-${link.id}`}>Fonte do Link</Label>
                      <Select
                        onValueChange={(value) => handleUpdateTextLink(id, link.id, { style: { ...link.style, fontFamily: value } }, parentId)}
                        defaultValue={link.style.fontFamily}
                      >
                        <SelectTrigger id={`link-font-${link.id}`}>
                          <SelectValue placeholder="Selecione uma fonte" />
                        </SelectTrigger>
                        <SelectContent>
                          {fontOptions.map((font) => (
                            <SelectItem key={font} value={font}>{font}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Label htmlFor={`link-font-size-${link.id}`}>Tamanho da Fonte do Link</Label>
                      <Select
                        onValueChange={(value) => handleUpdateTextLink(id, link.id, { style: { ...link.style, fontSize: value } }, parentId)}
                        defaultValue={link.style.fontSize}
                      >
                        <SelectTrigger id={`link-font-size-${link.id}`}>
                          <SelectValue placeholder="Selecione um tamanho" />
                        </SelectTrigger>
                        <SelectContent>
                          {fontSizeOptions.map((size) => (
                            <SelectItem key={size} value={size}>{size}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex space-x-2">
                        <Button
                          variant={link.style.bold ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleUpdateTextLink(id, link.id, { style: { ...link.style, bold: !link.style.bold } }, parentId)}
                        >
                          B
                        </Button>
                        <Button
                          variant={link.style.italic ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleUpdateTextLink(id, link.id, { style: { ...link.style, italic: !link.style.italic } }, parentId)}
                        >
                          I
                        </Button>
                        <Button
                          variant={link.style.underline ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleUpdateTextLink(id, link.id, { style: { ...link.style, underline: !link.style.underline } }, parentId)}
                        >
                          U
                        </Button>
                      </div>
                    </div>
                  ))}
                {type === 'button' && (
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
                )}
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
                <div className="flex space-x-2">
                  <Button
                    variant={style.bold ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleUpdateComponent(id, { style: { ...style, bold: !style.bold } }, parentId)}
                  >
                    B
                  </Button>
                  <Button
                    variant={style.italic ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleUpdateComponent(id, { style: { ...style, italic: !style.italic } }, parentId)}
                  >
                    I
                  </Button>
                  <Button
                    variant={style.underline ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleUpdateComponent(id, { style: { ...style, underline: !style.underline } }, parentId)}
                  >
                    U
                  </Button>
                </div>
                {type === 'container' && (
                  <div className="space-y-2">
                    <Label htmlFor={`items-center-${id}`}>Alinhar Itens ao Centro</Label>
                    <Select
                      onValueChange={(value: string) =>
                        handleUpdateComponent(id, { itemsCenter: value === 'true' } as Partial<ContainerComponent>, parentId)
                      }
                      defaultValue={(component as ContainerComponent).itemsCenter ? 'true' : 'false'}
                    >
                      <SelectTrigger id={`items-center-${id}`}>
                        <SelectValue placeholder="Selecione o alinhamento vertical" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Ativado</SelectItem>
                        <SelectItem value="false">Desativado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {type === 'paragraph' && (
                  <div className="space-y-2">
                    <Label htmlFor={`items-center-${id}`}>Alinhar Texto ao Centro</Label>
                    <Select
                      onValueChange={(value: string) =>
                        handleUpdateComponent(id, { itemsCenter: value === 'true' } as Partial<ParagraphComponent>, parentId)
                      }
                      defaultValue={(component as ParagraphComponent).itemsCenter ? 'true' : 'false'}
                    >
                      <SelectTrigger id={`items-center-${id}`}>
                        <SelectValue placeholder="Selecione o alinhamento vertical" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Ativado</SelectItem>
                        <SelectItem value="false">Desativado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
                <div className="space-y-2">
                  <Label htmlFor={`padding-${id}`}>Padding</Label>
                  <Input
                    id={`padding-${id}`}
                    value={style.padding}
                    onChange={(e) => handleUpdateComponent(id, { style: { ...style, padding: e.target.value } }, parentId)}
                    placeholder="10px 20px"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`margin-${id}`}>Margin</Label>
                  <Input
                    id={`margin-${id}`}
                    value={style.margin}
                    onChange={(e) => handleUpdateComponent(id, { style: { ...style, margin: e.target.value } }, parentId)}
                    placeholder="10px 20px"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`border-radius-${id}`}>Border Radius</Label>
                  <Input
                    id={`border-radius-${id}`}
                    value={style.borderRadius}
                    onChange={(e) => handleUpdateComponent(id, { style: { ...style, borderRadius: e.target.value } }, parentId)}
                    placeholder="5px"
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
        ${style.italic ? 'font-style: italic;' : ''}
        ${style.underline ? 'text-decoration: underline;' : ''}
        padding: ${style.padding};
        margin: ${style.margin};
        border-radius: ${style.borderRadius};
        background-color: ${style.backgroundColor};
      `;

      switch (type) {
        case 'container':
          return `
            <div style="${commonStyle} ${(component as ContainerComponent).itemsCenter ? 'display: flex; align-items: center;' : ''} ${(component as ContainerComponent).alignment === 'row' ? 'flex-direction: row;' : 'flex-direction: column;'}">
              ${(component as ContainerComponent).children.map(renderComponent).join('')}
            </div>
          `;
        case 'title':
          return `<h2 style="${commonStyle}">${content}</h2>`;
        case 'paragraph':
          const paragraphComponent = component as ParagraphComponent;
          const paragraphContent = Array.isArray(paragraphComponent.content)
            ? paragraphComponent.content.map(item => {
                if (typeof item === 'string') {
                  return item;
                } else {
                  const linkStyle = `
                    color: ${item.style.color};
                    font-family: ${item.style.fontFamily};
                    font-size: ${item.style.fontSize};
                    ${item.style.bold ? 'font-weight: bold;' : ''}
                    ${item.style.italic ? 'font-style: italic;' : ''}
                    ${item.style.underline ? 'text-decoration: underline;' : ''}
                  `;
                  return `<a href="${item.url}" style="${linkStyle}">${item.text}</a>`;
                }
              }).join('')
            : paragraphComponent.content;
          return `<p style="${commonStyle} ${paragraphComponent.itemsCenter ? 'text-align: center;' : ''}">${paragraphContent}</p>`;
        case 'image':
          return `<img src="${content}" alt="Email content" style="width: ${style.width}; height: ${style.height};" />`;
        case 'button':
          return `
            <a href="${style.link}" style="text-decoration: none;">
              <button style="${commonStyle} border: none; padding: 10px 20px; cursor: pointer;">
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
        <div style="max-width: auto; margin: 0 auto;         background-color: #ffffff; padding: 20px;">
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
    const templateToSave = {
      ...template,
      id: currentTemplateId || generateId(),
    };

    setSavedTemplates(prev => {
      const existingIndex = prev.findIndex(t => t.id === templateToSave.id);
      if (existingIndex >= 0) {
        const updatedTemplates = [...prev];
        updatedTemplates[existingIndex] = templateToSave;
        return updatedTemplates;
      } else {
        return [...prev, templateToSave];
      }
    });

    setCurrentTemplateId(templateToSave.id);
    console.log('Template salvo:', templateToSave);
    const htmlContent = generateEmailHtml(templateToSave);
    console.log('HTML gerado:', htmlContent);
  }

  const handlePreview = () => {
    const htmlContent = generateEmailHtml(template);
    setPreviewHtml(htmlContent);
  }

  const loadTemplate = (templateId: string) => {
    const templateToLoad = savedTemplates.find(t => t.id === templateId);
    if (templateToLoad) {
      setTemplate(templateToLoad);
      setCurrentTemplateId(templateId);
    }
  };

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
            <Label htmlFor="saved-templates">Templates Salvos</Label>
            <Select onValueChange={loadTemplate} value={currentTemplateId || undefined}>
              <SelectTrigger id="saved-templates">
                <SelectValue placeholder="Selecione um template" />
              </SelectTrigger>
              <SelectContent>
                {savedTemplates.map(t => (
                  <SelectItem key={t.id} value={t.id ?? ''}>
                    {t.subject || `Template ${t.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={() => {
            setTemplate({
              subject: '',
              recipient: '',
              components: [],
              style: {
                backgroundColor: '#ffffff',
                textAlign: 'left',
                footerText: '© 2023 Sua Empresa. Todos os direitos reservados.'
              }
            });
            setCurrentTemplateId(null);
          }}>
            Novo Template
          </Button>
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
        <CardFooter className='flex flex-row gap-4'>
          <Button onClick={handleSave} className="w-full">Salvar Template</Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button onClick={handlePreview} className="w-full">Visualizar</Button>
            </DialogTrigger>
            <DialogContent className="max-w-[90vw] max-h-[90vh] overflow-auto">
              <DialogHeader>
                <DialogTitle>Prévia do E-mail</DialogTitle>
              </DialogHeader>
              <iframe srcDoc={previewHtml} className="w-full h-[80vh] border-0" />
            </DialogContent>
          </Dialog>
        </CardFooter>
      </Card>
    </div>
  )
}
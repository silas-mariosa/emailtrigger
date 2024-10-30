'use client'

import { useEffect, useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ChevronUp, ChevronDown, Trash2, Settings, Plus, Upload } from 'lucide-react'

type ComponentType = 'container' | 'title' | 'paragraph' | 'image' | 'button'
type AlignmentType = 'row' | 'column'
type TextAlignType = 'left' | 'center' | 'right'
type ObjectFitType = 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
type ItemsType = 'start' | 'center' | 'end' | 'stretch' | 'baseline'
type JustifyType = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
type RoundedType = 'none' | 'sm' | 'md' | 'lg' | 'full'
type FontSizeType = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl'

interface BaseStyle {
  textAlign: TextAlignType;
  backgroundColor?: string;
  padding: string;
  margin: string;
  borderRadius: RoundedType;
  color?: string;
  fontFamily?: string;
  fontSize?: FontSizeType;
  alignItems?: ItemsType;
  justifyContent?: JustifyType;
  alignSelf?: 'center' | 'flex-start' | 'flex-end';
}

interface BaseComponent {
  id: string;
  type: ComponentType;
  style: BaseStyle;
}

interface ContainerComponent extends BaseComponent {
  type: 'container';
  children: EmailComponent[];
  alignment: AlignmentType;
  itemsCenter: boolean;
  style: BaseStyle & {
    alignItems?: ItemsType;
  };
}

interface TitleComponent extends BaseComponent {
  type: 'title';
  content: string;
}

interface TextElement {
  id: string;
  type: 'text';
  content: string;
  style: {
    color: string;
    fontFamily: string;
    fontSize: FontSizeType;
    bold: boolean;
    italic: boolean;
    underline: boolean;
  };
}

interface LinkElement {
  id: string;
  type: 'link';
  content: string;
  url: string;
  style: {
    color: string;
    fontFamily: string;
    fontSize: FontSizeType;
    bold: boolean;
    italic: boolean;
    underline: boolean;
  };
}

type ParagraphElement = TextElement | LinkElement;

interface ParagraphComponent extends BaseComponent {
  type: 'paragraph';
  elements: ParagraphElement[];
  itemsCenter?: boolean;
}

interface ImageComponent extends BaseComponent {
  type: 'image';
  content: string;
  style: BaseStyle & {
    width: string;
    height: string;
    objectFit: ObjectFitType;
    alignSelf?: 'center' | 'flex-start' | 'flex-end';
  };
}

interface ButtonComponent extends BaseComponent {
  type: 'button';
  content: string;
  style: BaseStyle & {
    link?: string;
  };
}

type EmailComponent = ContainerComponent | TitleComponent | ParagraphComponent | ImageComponent | ButtonComponent;

interface EmailTemplate {
  id?: string;
  subject: string;
  recipient: string;
  components: EmailComponent[];
  style: {
    backgroundColor: string;
    textAlign: TextAlignType;
    footerText: string;
    footerBackgroundColor: string;
  };
}

const fontOptions = ['Arial', 'Helvetica', 'Times New Roman', 'Courier', 'Verdana', 'Georgia']
const fontSizeOptions: FontSizeType[] = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl']
const objectFitOptions: ObjectFitType[] = ['contain', 'cover', 'fill', 'none', 'scale-down']
const itemsOptions: ItemsType[] = ['start', 'center', 'end', 'stretch', 'baseline']
const justifyOptions: JustifyType[] = ['start', 'center', 'end', 'between', 'around', 'evenly']
const roundedOptions: RoundedType[] = ['none', 'sm', 'md', 'lg', 'full']

export default function EmailTemplateEditor() {
  const [template, setTemplate] = useState<EmailTemplate>({
    subject: '',
    recipient: '',
    components: [],
    style: {
      backgroundColor: '#ffffff',
      textAlign: 'center',
      footerText: '© 2024 Sua Empresa. Todos os direitos reservados.',
      footerBackgroundColor: '#ffffff'
    }
  })
  const [savedTemplates, setSavedTemplates] = useState<EmailTemplate[]>([]);
  const [currentTemplateId, setCurrentTemplateId] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const storedTemplates = localStorage.getItem('emailTemplates');
    if (storedTemplates) {
      setSavedTemplates(JSON.parse(storedTemplates));
    }
  }, []);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const createNewComponent = (type: ComponentType): EmailComponent => {
    const baseComponent: BaseComponent = {
      id: generateId(),
      type,
      style: {
        textAlign: 'center',
        padding: '0px',
        margin: '0px',
        borderRadius: 'none',
      }
    };

    switch (type) {
      case 'container':
        return { ...baseComponent, children: [], alignment: 'column', backgroundColor: '#ffffff', itemsCenter: false } as ContainerComponent;
      case 'title':
        return { ...baseComponent, content: 'New Title' } as TitleComponent;
      case 'paragraph':
        return { ...baseComponent, elements: [] } as ParagraphComponent;
      case 'image':
        return { ...baseComponent, content: '', style: { ...baseComponent.style, width: '100%', height: 'auto', objectFit: 'contain' } } as ImageComponent;
      case 'button':
        return { ...baseComponent, content: 'Click me', style: { ...baseComponent.style, backgroundColor: '#007bff', link: '#' } } as ButtonComponent;
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
            component.id === parentId && component.type === 'container'
              ? { ...component, children: [...(component as ContainerComponent).children, newComponent] }
              : component
          )
        };
      }
    });
  }

  const handleUpdateComponent = (id: string, updates: Partial<EmailComponent>, parentId: string | null = null) => {
    setTemplate(prev => {
      const updateComponent = (components: EmailComponent[]): EmailComponent[] =>
        components.map(component => {
          if (component.id === id) {
            switch (component.type) {
              case 'container':
                return { ...component, ...updates } as ContainerComponent;
              case 'title':
                return { ...component, ...updates } as TitleComponent;
              case 'paragraph':
                return { ...component, ...updates } as ParagraphComponent;
              case 'image':
                return { ...component, ...updates } as ImageComponent;
              case 'button':
                return { ...component, ...updates } as ButtonComponent;
              default:
                return component;
            }
          }
          if (component.type === 'container') {
            return {
              ...component,
              children: updateComponent((component as ContainerComponent).children)
            } as ContainerComponent;
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
              ? { ...component, children: updateComponent((component as ContainerComponent).children) }
              : component
          )
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
            return { ...component, children: deleteFromArray((component as ContainerComponent).children) };
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
              ? { ...component, children: deleteFromArray((component as ContainerComponent).children) }
              : component
          )
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
              ? { ...component, children: moveInArray((component as ContainerComponent).children) }
              : component
          )
        };
      }
    });
  }

  const handleAddParagraphElement = (paragraphId: string, elementType: 'text' | 'link', parentId: string | null = null) => {
    setTemplate(prev => {
      const updateComponent = (components: EmailComponent[]): EmailComponent[] =>
        components.map(component => {
          if (component.id === paragraphId && component.type === 'paragraph') {
            const newElement: ParagraphElement = elementType === 'text'
              ? {
                  id: generateId(),
                  type: 'text',
                  content: 'New text',
                  style: {
                    color: '#000000',
                    fontFamily: 'Arial',
                    fontSize: 'base',
                    bold: false,
                    italic: false,
                    underline: false,
                  }
                }
              : {
                  id: generateId(),
                  type: 'link',
                  content: 'New link',
                  url: '#',
                  style: {
                    color: '#0000FF',
                    fontFamily: 'Arial',
                    fontSize: 'base',
                    bold: false,
                    italic: false,
                    underline: true,
                  }
                };
            return {
              ...component,
              elements: [...(component as ParagraphComponent).elements, newElement]
            };
          }
          if (component.type === 'container') {
            return { ...component, children: updateComponent((component as ContainerComponent).children) };
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
              ? { ...component, children: updateComponent((component as ContainerComponent).children) }
              : component
          )
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
            return {
              ...component,
              children: updateComponent((component as ContainerComponent).children)
            } as ContainerComponent;
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
              ? { ...component, children: updateComponent((component as ContainerComponent).children) }
              : component
          )
        };
      }
    });
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>, componentId: string, parentId: string | null = null) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        handleUpdateComponent(componentId, { content }, parentId);
      };
      
      reader.readAsDataURL(file);
    }
  };

  const renderComponentEditor = (component: EmailComponent, parentId: string | null = null) => {
    const { id, type, style } = component;
    const commonProps = {
      style: {
        textAlign: style.textAlign,
        padding: style.padding,
        margin: style.margin,
        borderRadius: style.borderRadius,
        backgroundColor: style.backgroundColor,
        color: style.color,
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        alignSelf: style.alignSelf,
      }
    };

    const componentContent = (() => {
      switch (type) {
        case 'container':
          return renderContainerContent(component as ContainerComponent, id, parentId);
        case 'title':
          return <h2 {...commonProps}>{(component as TitleComponent).content}</h2>;
        case 'paragraph':
          return renderParagraphContent(component as ParagraphComponent, id, parentId);
        case 'image':
          return renderImageContent(component as ImageComponent, id, parentId);
        case 'button':
          return renderButtonContent(component as ButtonComponent, commonProps);
        default:
          return null;
      }
    })();

    return (
      <div key={id} className="relative group border p-2 my-2" style={commonProps.style}>
        {componentContent}
        <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-wrap justify-end">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon"><Settings className="h-4 w-4" /></Button>
            </PopoverTrigger>
            <PopoverContent className="w-96">
              <div className="grid grid-cols-2 gap-4">
                {renderComponentStyleOptions(component, id, parentId)}
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

  const renderComponentStyleOptions = (component: EmailComponent, id: string, parentId: string | null) => {
    const { type, style } = component;
    const commonOptions = (
      <>
        <div className="space-y-2">
          <Label htmlFor={`padding-${id}`}>Padding</Label>
          <Input
            id={`padding-${id}`}
            value={style.padding}
            onChange={(e) => handleUpdateComponent(id, { style: { ...style, padding: e.target.value } }, parentId)}
            placeholder="0px 0px 0px 0px"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`margin-${id}`}>Margin</Label>
          <Input
            id={`margin-${id}`}
            value={style.margin}
            onChange={(e) => handleUpdateComponent(id, { style: { ...style, margin: e.target.value } }, parentId)}
            placeholder="0px 0px 0px 0px"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`bg-color-${id}`}>Background Color</Label>
          <Input
            id={`bg-color-${id}`}
            type="color"
            value={style.backgroundColor}
            onChange={(e) => handleUpdateComponent(id, { style: { ...style, backgroundColor: e.target.value } }, parentId)}
          />
        </div>
      </>
    );

    const textOptions = (
      <>
        <div className="space-y-2">
          <Label htmlFor={`font-${id}`}>Font</Label>
          <Select
            onValueChange={(value) => handleUpdateComponent(id, { style: { ...style, fontFamily: value } }, parentId)}
            defaultValue={style.fontFamily}
          >
            <SelectTrigger id={`font-${id}`}>
              <SelectValue placeholder="Select font" />
            </SelectTrigger>
            <SelectContent>
              {fontOptions.map((option) => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`text-color-${id}`}>Text Color</Label>
          <Input
            id={`text-color-${id}`}
            type="color"
            value={style.color}
            onChange={(e) => handleUpdateComponent(id, { style: { ...style, color: e.target.value } }, parentId)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`text-align-${id}`}>Text Align</Label>
          <Select
            onValueChange={(value: TextAlignType) => handleUpdateComponent(id, { style: { ...style, textAlign: value } }, parentId)}
            defaultValue={style.textAlign}
          >
            <SelectTrigger id={`text-align-${id}`}>
              <SelectValue placeholder="Select alignment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left">Left</SelectItem>
              <SelectItem value="center">Center</SelectItem>
              <SelectItem value="right">Right</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`text-size-${id}`}>Text Size</Label>
          <Select
            onValueChange={(value) => handleUpdateComponent(id, { style: { ...style, fontSize: value as FontSizeType } }, parentId)}
            defaultValue={style.fontSize}
          >
            <SelectTrigger id={`text-size-${id}`}>
              <SelectValue placeholder="Select size" />
            </SelectTrigger>
            <SelectContent>
              {fontSizeOptions.map((option) => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </>
    );

    switch (type) {
      case 'container':
        return (
          <>
            {commonOptions}
            <div className="space-y-2">
              <Label htmlFor={`items-${id}`}>Items</Label>
              <Select
                onValueChange={(value) => handleUpdateComponent(id, { style: { ...style, alignItems: value as ItemsType } }, parentId)}
                defaultValue={style.alignItems}
              >
                <SelectTrigger id={`items-${id}`}>
                  <SelectValue placeholder="Select items" />
                </SelectTrigger>
                <SelectContent>
                  {itemsOptions.map((option) => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`justify-${id}`}>Justify</Label>
              <Select
                onValueChange={(value) => handleUpdateComponent(id, { style: { ...style, justifyContent: value as JustifyType } }, parentId)}
                defaultValue={style.justifyContent}
              >
                <SelectTrigger id={`justify-${id}`}>
                  <SelectValue placeholder="Select justify" />
                </SelectTrigger>
                <SelectContent>
                  {justifyOptions.map((option) => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        );
      case 'title':
      case 'paragraph':
      case 'button':
        return (
          <>
            {commonOptions}
            {textOptions}
            <div className="space-y-2">
              <Label htmlFor={`rounded-${id}`}>Rounded</Label>
              <Select
                onValueChange={(value) => handleUpdateComponent(id, { style: { ...style, borderRadius: value as RoundedType } }, parentId)}
                defaultValue={style.borderRadius}
              >
                <SelectTrigger id={`rounded-${id}`}>
                  <SelectValue placeholder="Select rounded" />
                </SelectTrigger>
                <SelectContent>
                  {roundedOptions.map((option) => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        );
      case 'image':
        return (
          <>
            {commonOptions}
            <div className="space-y-2">
              <Label htmlFor={`width-${id}`}>Width</Label>
              <Input
                id={`width-${id}`}
                value={(component as ImageComponent).style.width}
                onChange={(e) => handleUpdateComponent(id, { style: { ...(component as ImageComponent).style, width: e.target.value } }, parentId)}
                placeholder="100%, 300px, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`height-${id}`}>Height</Label>
              <Input
                id={`height-${id}`}
                value={(component as ImageComponent).style.height}
                onChange={(e) => handleUpdateComponent(id, { style: { ...(component as ImageComponent).style, height: e.target.value } }, parentId)}
                placeholder="auto, 200px, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`object-fit-${id}`}>Object Fit</Label>
              <Select
                onValueChange={(value: ObjectFitType) => handleUpdateComponent(id, { style: { ...(component as ImageComponent).style, objectFit: value } }, parentId)}
                defaultValue={(component as ImageComponent).style.objectFit}
              >
                <SelectTrigger id={`object-fit-${id}`}>
                  <SelectValue placeholder="Select object fit" />
                </SelectTrigger>
                <SelectContent>
                  {objectFitOptions.map((option) => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`alignSelf-${id}`}>Align Self</Label>
              <Select
                onValueChange={(value: 'center' | 'flex-start' | 'flex-end') => handleUpdateComponent(id, { style: { ...(component as ImageComponent).style, alignSelf: value } }, parentId)}
                defaultValue={(component as ImageComponent).style.alignSelf}
              >
                <SelectTrigger id={`alignSelf-${id}`}>
                  <SelectValue placeholder="Select align self" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="flex-start">Flex Start</SelectItem>
                  <SelectItem value="flex-end">Flex End</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );
      default:
        return null;
    }
  }

  const renderContainerContent = (component: ContainerComponent, id: string, parentId: string | null) => (
    <div className={`border-2 border-dashed border-gray-300 p-4 my-4`} style={{ backgroundColor: component.style.backgroundColor }}>
      <h3 className="text-lg font-semibold mb-2">Container</h3>
      <div className={`flex ${component.alignment === 'row' ? 'flex-row' : 'flex-col'} gap-4 ${component.itemsCenter ? (component.alignment === 'row' ? 'items-center' : 'items-center') : ''}`} style={{ alignItems: component.alignment === 'column' ? component.style.alignItems : undefined }}>
        {component.children.map(child => (
          <div key={child.id} className={`${component.alignment === 'row' ? 'flex-1' : 'w-full'}`}>
            {renderComponentEditor(child, id)}
          </div>
        ))}
      </div>
      {component.children.length < 4 && (
        <div className="mt-2 flex gap-2 flex-wrap">
          <Button onClick={() => handleAddComponent('container', id)} size="sm">
            <Plus className="mr-2 h-4 w-4" /> Sub-Container
          </Button>
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
      <div className="space-y-2 mt-2">
        <Label htmlFor={`alignment-${id}`}>Direção do Container</Label>
        <Select
          onValueChange={(value: AlignmentType) =>
            handleUpdateComponent(id, { alignment: value }, parentId)
          }
          defaultValue={component.alignment}
        >
          <SelectTrigger id={`alignment-${id}`}>
            <SelectValue placeholder="Selecione a direção" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="column">Vertical (Flex Column)</SelectItem>
            <SelectItem value="row">Horizontal (Flex Row)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderParagraphContent = (component: ParagraphComponent, id: string, parentId: string | null) => (
    <div className={`my-2 ${component.itemsCenter ? 'text-center' : ''}`}>
      {component.elements.map((element, index) => (
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
              <div className="grid gap-2">
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
                    onValueChange={(value) => handleUpdateParagraphElement(id, element.id, { style: { ...element.style, fontSize: value as FontSizeType } }, parentId)}
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
        <Button onClick={() => handleAddParagraphElement(id, 'text', parentId)} size="sm" variant="outline">
          <Plus className="mr-2 h-4 w-4" /> Adicionar Texto
        </Button>
        <Button onClick={() => handleAddParagraphElement(id, 'link', parentId)} size="sm" variant="outline">
          <Plus className="mr-2 h-4 w-4" /> Adicionar Link
        </Button>
      </div>
    </div>
  );

  const renderImageContent = (component: ImageComponent, id: string, parentId: string | null) => (
    <div className='flex flex-col items-center'>
      <div style={{ maxWidth: '100%', overflow: 'hidden' }}>
        <img
          src={component.content}
          alt="Conteúdo do email"
          style={{
            width: component.style.width,
            height: component.style.height,
            objectFit: component.style.objectFit,
            margin: component.style.alignSelf === 'center' ? '0 auto' : undefined,
          }}
          className="my-2"
        />
      </div>
      <div className="flex gap-2 mt-2">
        <Button onClick={() => fileInputRef.current?.click()} size="sm">
          <Upload className="mr-2 h-4 w-4" /> Upload Imagem
        </Button>
        <Button
          onClick={() => handleUpdateComponent(id, { style: { ...component.style, alignSelf: 'center' } }, parentId)}
          size="sm"
        >
          Alinhar ao Centro
        </Button>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={(e) => handleImageUpload(e, id, parentId)}
        accept="image/*"
      />
    </div>
  );

  const renderButtonContent = (component: ButtonComponent, commonProps: any) => (
    <div style={{ textAlign: component.style.textAlign }}>
      <a href={component.style.link} target="_blank" rel="noopener noreferrer">
        <button {...commonProps} className="px-4 py-2 rounded my-4 text-white">
          {component.content}
        </button>
      </a>
    </div>
  );

  const generateEmailHtml = (template: EmailTemplate): string => {
    const { subject, recipient, components, style } = template;

    const renderComponent = (component: EmailComponent): string => {
      const { type, style } = component;
      const commonStyle = `
        text-align: ${style.textAlign};
        padding: ${style.padding};
        margin: ${style.margin};
        border-radius: ${style.borderRadius};
        background-color: ${style.backgroundColor};
        ${style.alignSelf ? `align-self: ${style.alignSelf};` : ''}
      `;

      switch (type) {
        case 'container':
          return `
            <div style="${commonStyle} display: flex; ${component.alignment === 'row' ? 'flex-direction: row;' : `flex-direction: column;`} ${component.itemsCenter ? (component.alignment === 'row' ? 'align-items: center;' : 'align-items: center;') : ''} ${component.style.alignItems ? `align-items: ${component.style.alignItems};` : ''}">
              ${component.children.map(renderComponent).join('')}
            </div>
          `;
        case 'title':
          return `<h2 style="${commonStyle}">${(component as TitleComponent).content}</h2>`;
        case 'paragraph':
          const paragraphComponent = component as ParagraphComponent;
          const paragraphContent = paragraphComponent.elements.map(element => {
            const elementStyle = `
              color: ${element.style.color};
              font-family: ${element.style.fontFamily};
              font-size: ${element.style.fontSize};
              ${element.style.bold ? 'font-weight: bold;' : ''}
              ${element.style.italic ? 'font-style: italic;' : ''}
              ${element.style.underline ? 'text-decoration: underline;' : ''}
            `;
            return element.type === 'text'
              ? `<span style="${elementStyle}">${element.content}</span>`
              : `<a href="${element.url}" style="${elementStyle}">${element.content}</a>`;
          }).join('');
          return `<p style="${commonStyle} ${paragraphComponent.itemsCenter ? 'text-align: center;' : ''}">${paragraphContent}</p>`;
        case 'image':
          const imageComponent = component as ImageComponent;
          return `<img src="${imageComponent.content}" alt="Email content" style="${commonStyle} width: ${imageComponent.style.width}; height: ${imageComponent.style.height}; object-fit: ${imageComponent.style.objectFit}; max-width: 100%; display: block; margin: 0 auto;" />`;
        case 'button':
          const buttonComponent = component as ButtonComponent;
          return `
            <a href="${buttonComponent.style.link}" style="text-decoration: none;">
              <button style="${commonStyle} border: none; padding: 10px 20px; cursor: pointer;">
                ${buttonComponent.content}
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
        <div style="max-width: auto; margin: 0 auto; background-color: #ffffff; padding: 20px;">
          ${components.map(renderComponent).join('')}
          <footer style="margin-top: 20px; text-align: center; font-size: 12px; color: #666; background-color: ${style.footerBackgroundColor}; padding: 10px;">
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
      const updatedTemplates = prev.find(t => t.id === templateToSave.id)
        ? prev.map(t => t.id === templateToSave.id ? templateToSave : t)
        : [...prev, templateToSave];
      
      localStorage.setItem('emailTemplates', JSON.stringify(updatedTemplates));
      
      return updatedTemplates;
    });

    setCurrentTemplateId(templateToSave.id);
    console.log('Template salvo:', templateToSave);
    const htmlContent = generateEmailHtml(templateToSave);
    console.log('HTML gerado:', htmlContent);

    const jsonContent = JSON.stringify(templateToSave, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `template_${templateToSave.id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        try {
          const loadedTemplate = JSON.parse(content) as EmailTemplate;
          setTemplate(loadedTemplate);
          setCurrentTemplateId(loadedTemplate.id || null);
          console.log('Template carregado:', loadedTemplate);
        } catch (error) {
          console.error('Erro ao carregar o template:', error);
        }
      };
      reader.readAsText(file);
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
            <Label htmlFor="file-upload">Carregar Template JSON</Label>
            <Input
              id="file-upload"
              type="file"
              accept=".json"
              onChange={handleFileUpload}
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
            <footer className="mt-4 text-sm text-gray-500" style={{ backgroundColor: template.style.footerBackgroundColor, padding: '10px' }}>{template.style.footerText}</footer>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">Configurações Gerais</Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email-bg-color">Cor de Fundo do E-mail</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="email-bg-color"
                      type="color"
                      value={template.style.backgroundColor}
                      onChange={(e) => setTemplate(prev => ({ ...prev, style: { ...prev.style, backgroundColor: e.target.value } }))}
                    />
                    <Input
                      id="email-bg-color-hex"
                      type="text"
                      value={template.style.backgroundColor}
                      onChange={(e) => setTemplate(prev => ({ ...prev, style: { ...prev.style, backgroundColor: e.target.value } }))}
                      placeholder="#FFFFFF"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-align">Alinhamento Geral</Label>
                  <Select
                    onValueChange={(value: TextAlignType) => setTemplate(prev => ({ ...prev, style: { ...prev.style, textAlign: value } }))}
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
                <div className="space-y-2">
                  <Label htmlFor="footer-bg-color">Cor de Fundo do Rodapé</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="footer-bg-color"
                      type="color"
                      value={template.style.footerBackgroundColor}
                      onChange={(e) => setTemplate(prev => ({ ...prev, style: { ...prev.style, footerBackgroundColor: e.target.value } }))}
                    />
                    <Input
                      id="footer-bg-color-hex"
                      type="text"
                      value={template.style.footerBackgroundColor}
                      onChange={(e) => setTemplate(prev => ({ ...prev, style: { ...prev.style, footerBackgroundColor: e.target.value } }))}
                      placeholder="#FFFFFF"
                    />
                  </div>
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
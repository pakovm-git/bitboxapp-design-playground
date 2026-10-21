// SPDX-License-Identifier: Apache-2.0

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Accordion } from '@/components/accordion/accordion';
import { useDesktopModernized } from '@/components/desktop-chrome/desktop-chrome';
import { useDarkmode } from '@/hooks/darkmode';
import { Button, Input, Select } from '@/components/forms';
import { desktopDesignSnapshot, designColumns, designElements, designLayouts, designPositions, designStyleFields, orderedDesignItems, redoDesktopDesign, saveDesktopDesign, TDesignLayout, TDesignLayoutId, undoDesktopDesign } from '@/utils/desktop-design';
import { notifyChromeLayout } from '@/utils/desktop-chrome';
import { useDesktopDesign } from '@/hooks/desktop-design';
import { DesktopDesignStyles, designSelector } from './design-styles';
import styles from './desktop-design.module.css';
import './calm-cards/calm-cards.css';

export const DesktopDesign = () => useDesktopModernized() ? <DesktopDesignEditor /> : null;

export const DesktopDesignEditor = () => {
  const { t } = useTranslation();
  const { isDarkMode } = useDarkmode();
  const mode = isDarkMode ? 'dark' : 'light';
  const snapshot = useDesktopDesign();
  const { design } = snapshot;
  const [open, setOpen] = useState(false);
  const [picking, setPicking] = useState(false);
  const [selected, setSelected] = useState('portfolioChart');
  const [group, setGroup] = useState<TDesignLayoutId>('portfolio');
  const [dragging, setDragging] = useState<string>();
  const [announcement, setAnnouncement] = useState('');
  const [draft, setDraft] = useState<{ id: string; value: string }>();
  const panelRef = useRef<HTMLElement>(null);
  const opener = useRef<HTMLElement>();
  const name = (id: string) => t(`desktopDesign.editor.elements.${id}`);

  useEffect(() => {
    const show = () => {
      opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
      setOpen(true);
    };
    window.addEventListener('bitbox-design-editor-open', show);
    return () => window.removeEventListener('bitbox-design-editor-open', show);
  }, []);

  useEffect(() => {
    if (open) {
      panelRef.current?.querySelector('button')?.focus();
      return () => {
        if (opener.current?.isConnected) {
          opener.current.focus();
        }
      };
    }
  }, [open]);

  useEffect(() => notifyChromeLayout(), [design, open]);

  useEffect(() => {
    if (design.template) {
      document.body.dataset.designTemplate = design.template;
    } else {
      delete document.body.dataset.designTemplate;
    }
    return () => {
      delete document.body.dataset.designTemplate;
    };
  }, [design.template]);

  useEffect(() => {
    if (!picking) {
      return;
    }
    document.body.setAttribute('data-design-picking', '');
    const pick = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent && event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        setPicking(false);
        return;
      }
      if (event instanceof KeyboardEvent && event.key !== 'Enter' && event.key !== ' ') {
        return;
      }
      const target = event.target instanceof Element ? event.target : undefined;
      if (target?.closest('[data-design-editor]')) {
        return;
      }
      // Selecting an element must never activate the wallet control underneath it.
      event.preventDefault();
      event.stopPropagation();
      const element = target?.closest<HTMLElement>('[data-design-element]');
      const id = element?.dataset.designElement;
      if (id && designElements.includes(id) && element.closest('[data-design-scope]')) {
        setSelected(id);
        setPicking(false);
        panelRef.current?.querySelector<HTMLSelectElement>('#design-element')?.focus();
      }
    };
    document.addEventListener('click', pick, true);
    document.addEventListener('keydown', pick, true);
    return () => {
      document.body.removeAttribute('data-design-picking');
      document.removeEventListener('click', pick, true);
      document.removeEventListener('keydown', pick, true);
    };
  }, [picking]);

  const updateLayout = (next: TDesignLayout) => {
    const latest = desktopDesignSnapshot().design;
    saveDesktopDesign({ ...latest, layouts: { ...latest.layouts, [group]: { ...latest.layouts[group], ...next } } });
  };
  const layout = design.layouts[group] ?? {};
  const blocks = orderedDesignItems(designLayouts[group].items.map(id => ({ id })), layout.order);
  const reorder = (id: string, destination: number) => {
    const order: string[] = orderedDesignItems(designLayouts[group].items.map(item => ({ id: item })), desktopDesignSnapshot().design.layouts[group]?.order).map(block => block.id);
    const source = order.indexOf(id);
    if (source < 0 || destination < 0 || destination >= order.length || destination === source) {
      return;
    }
    order.splice(source, 1);
    order.splice(destination, 0, id);
    updateLayout({ order });
    setAnnouncement(t('desktopDesign.editor.moved', { name: name(id), position: destination + 1 }));
  };
  const updateStyle = (id: string, value: string | number | undefined) => {
    const latest = desktopDesignSnapshot().design;
    const color = designStyleFields.find(field => field.id === id)?.type === 'color';
    const next = { ...(color ? latest.colors?.[mode]?.[selected] : latest.elements[selected]) };
    if (value === undefined) {
      delete next[id];
    } else {
      next[id] = value;
    }
    saveDesktopDesign(color ? { ...latest, colors: { ...latest.colors, [mode]: { ...latest.colors?.[mode], [selected]: next } } }
      : { ...latest, elements: { ...latest.elements, [selected]: next } });
  };

  return (<>
    <DesktopDesignStyles design={design} mode={mode} />
    {open && (
      <aside className={styles.panel} ref={panelRef} data-design-editor data-window-no-drag-overlay aria-label={t('desktopDesign.editor.title')}>
        <div className={styles.toolbar}>
          <h2>{t('desktopDesign.editor.title')}</h2>
          <Button secondary onClick={() => {
            setPicking(false); setOpen(false);
          }}>{t('generic.close')}</Button>
        </div>
        <p>{t('desktopDesign.editor.description')}</p>
        <div className={styles.actions}>
          <Button secondary aria-pressed={picking} onClick={() => setPicking(!picking)}>{t(picking ? 'desktopDesign.editor.cancelPick' : 'desktopDesign.editor.pick')}</Button>
          <Button secondary disabled={!snapshot.canUndo} onClick={undoDesktopDesign}>{t('desktopDesign.editor.undo')}</Button>
          <Button secondary disabled={!snapshot.canRedo} onClick={redoDesktopDesign}>{t('desktopDesign.editor.redo')}</Button>
        </div>
        {picking && <p role="status">{t('desktopDesign.editor.pickHelp')}</p>}
        {snapshot.saveFailed && <p role="alert">{t('desktopDesign.saveFailed')}</p>}
        <div className={styles.field}>
          <label htmlFor="design-element">{t('desktopDesign.editor.element')}</label>
          <Select id="design-element" aria-label={t('desktopDesign.editor.element')} value={selected}
            options={designElements.map(id => ({ value: id, text: name(id) }))}
            onChange={event => setSelected(event.target.value)} />
        </div>
        {open && <style>{`${designSelector(selected)} { outline: 2px solid var(--color-blue); outline-offset: 2px; }`}</style>}
        <Accordion title={t('desktopDesign.editor.layout')} defaultOpen>
          <div className={styles.field}>
            <label htmlFor="design-group">{t('desktopDesign.editor.group')}</label>
            <Select id="design-group" aria-label={t('desktopDesign.editor.group')} value={group}
              options={Object.keys(designLayouts).map(id => ({ value: id, text: name(id) }))}
              onChange={event => setGroup(event.target.value as TDesignLayoutId)} />
          </div>
          {designLayouts[group].kind === 'columns' && (
            <div className={styles.field}>
              <label htmlFor="design-columns">{t('desktopDesign.editor.columns')}</label>
              <Select id="design-columns" aria-label={t('desktopDesign.editor.columns')} value={layout.columns ?? 'original'}
                options={designColumns.map(value => ({ value, text: t(`desktopDesign.editor.options.${value}`) }))}
                onChange={event => updateLayout({ columns: event.target.value as TDesignLayout['columns'] })} />
            </div>
          )}
          <p>{t('desktopDesign.editor.reorderHelp')}</p>
          <ol className={styles.blocks}>
            {blocks.map(({ id }, index) => (
              <li key={id} draggable onDragStart={() => setDragging(id)} onDragEnd={() => setDragging(undefined)}
                onDragOver={event => {
                  if (dragging) {
                    event.preventDefault();
                  }
                }}
                onDrop={event => {
                  event.preventDefault(); if (dragging) {
                    reorder(dragging, index);
                  } setDragging(undefined);
                }}>
                <div className={styles.blockName}>
                  <span className={styles.grip} role="img" aria-label={t('desktopDesign.editor.drag', { name: name(id) })}>⋮⋮</span>
                  <Button secondary onClick={() => setSelected(id)}>{name(id)}</Button>
                  <Button secondary disabled={index === 0} aria-label={t('desktopDesign.editor.moveUp', { name: name(id) })} onClick={() => reorder(id, index - 1)}>↑</Button>
                  <Button secondary disabled={index === blocks.length - 1} aria-label={t('desktopDesign.editor.moveDown', { name: name(id) })} onClick={() => reorder(id, index + 1)}>↓</Button>
                </div>
                {designLayouts[group].kind === 'columns' && layout.columns !== undefined && layout.columns !== 'original' && layout.columns !== 'single' && (
                  <Select id={`design-position-${id}`} aria-label={t('desktopDesign.editor.position', { name: name(id) })} value={layout.positions?.[id] ?? 'main'}
                    options={designPositions.map(value => ({ value, text: t(`desktopDesign.editor.options.${value}`) }))}
                    onChange={event => updateLayout({ positions: { ...desktopDesignSnapshot().design.layouts[group]?.positions, [id]: event.target.value as typeof designPositions[number] } })} />
                )}
              </li>
            ))}
          </ol>
          <Button secondary onClick={() => {
            const latest = desktopDesignSnapshot().design;
            const layouts = { ...latest.layouts };
            delete layouts[group];
            saveDesktopDesign({ ...latest, layouts });
          }}>{t('desktopDesign.editor.resetLayout')}</Button>
        </Accordion>
        <Accordion title={t('desktopDesign.editor.style')}>
          <p>{t('desktopDesign.editor.palette', { mode: t(`desktopDesign.${mode}`) })}</p>
          <div className={styles.fields}>
            {designStyleFields.map(field => {
              const value = field.type === 'color' ? design.colors?.[mode]?.[selected]?.[field.id] : design.elements[selected]?.[field.id];
              const draftId = `${mode}:${selected}:${field.id}`;
              const label = t(`desktopDesign.editor.fields.${field.id}`);
              return (<div key={field.id} className={styles.field}>
                <label htmlFor={`design-style-${field.id}`}>{label}{field.type === 'number' && field.unit ? ` (${field.unit})` : ''}</label>
                {field.type === 'select' ? (
                  <Select id={`design-style-${field.id}`} aria-label={label} value={value ?? ''}
                    options={[{ value: '', text: t('desktopDesign.editor.inherit') }, ...field.options.map(option => ({ value: option, text: t(`desktopDesign.editor.options.${option}`) }))]}
                    onChange={event => updateStyle(field.id, event.target.value || undefined)} />
                )
                  : (
                    <Input id={`design-style-${field.id}`} aria-label={label} type={field.type === 'color' ? 'color' : 'number'} value={draft?.id === draftId ? draft.value : value ?? (field.type === 'color' ? '#000000' : '')}
                      {...(field.type === 'number' ? { min: field.min, max: field.max, step: field.step ?? 1, placeholder: t('desktopDesign.editor.inherit') } : {})}
                      onChange={event => {
                        setDraft({ id: draftId, value: event.currentTarget.value });
                        if (event.currentTarget.value === '') {
                          updateStyle(field.id, undefined);
                        } else if (event.currentTarget.validity.valid) {
                          updateStyle(field.id, field.type === 'color' ? event.currentTarget.value : event.currentTarget.valueAsNumber);
                        }
                      }} onBlur={() => setDraft(undefined)} />
                  )}
                {value !== undefined && <Button secondary onClick={() => updateStyle(field.id, undefined)}>{t('desktopDesign.editor.inherit')}</Button>}
                {field.type === 'color' && value === undefined && <span>{t('desktopDesign.editor.inherit')}</span>}
              </div>);
            })}
          </div>
          <Button secondary onClick={() => {
            const latest = desktopDesignSnapshot().design;
            const elements = { ...latest.elements };
            delete elements[selected];
            const light = { ...latest.colors?.light };
            const dark = { ...latest.colors?.dark };
            delete light[selected];
            delete dark[selected];
            saveDesktopDesign({ ...latest, elements, colors: { light, dark } });
          }}>{t('desktopDesign.editor.resetElement')}</Button>
        </Accordion>
        <div className={styles.actions}>
          <Button secondary onClick={() => saveDesktopDesign({ layouts: {}, elements: {} })}>{t('desktopDesign.editor.resetAll')}</Button>
        </div>
        <p aria-live="polite">{announcement}</p>
      </aside>
    )}
  </>);
};

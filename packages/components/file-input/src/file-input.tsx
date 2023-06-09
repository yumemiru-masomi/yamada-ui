import {
  ui,
  forwardRef,
  omitThemeProps,
  CSSUIObject,
  HTMLUIProps,
  ThemeProps,
  CSSUIProps,
  useMultiComponentStyle,
} from '@yamada-ui/core'
import {
  FormControlOptions,
  useFormControlProps,
  formControlProperties,
} from '@yamada-ui/form-control'
import { useControllableState } from '@yamada-ui/use-controllable-state'
import {
  assignRef,
  cx,
  dataAttr,
  handlerAll,
  isNull,
  mergeRefs,
  omitObject,
  pickObject,
} from '@yamada-ui/utils'
import {
  ChangeEvent,
  cloneElement,
  CSSProperties,
  FC,
  ForwardedRef,
  ReactElement,
  ReactNode,
  useCallback,
  useMemo,
  useRef,
} from 'react'

type Format = (value: File, index: number) => string

type FileInputOptions = {
  focusBorderColor?: CSSUIProps<'unresponsive'>['borderColor']
  errorBorderColor?: CSSUIProps<'unresponsive'>['borderColor']
  value?: File[] | null
  defaultValue?: File[] | null
  onChange?: (files: File[] | null) => void
  component?: FC<{ value: File; index: number }>
  format?: Format
  separator?: string
  children?: (files: File[] | null) => ReactNode
  resetRef?: ForwardedRef<() => void>
}

type InputProps = Partial<Pick<HTMLInputElement, 'accept' | 'multiple'>>

export type FileInputProps = Omit<HTMLUIProps<'div'>, 'onChange' | 'children'> &
  ThemeProps<'Input'> &
  InputProps &
  FileInputOptions &
  FormControlOptions

const defaultFormat: Format = ({ name }) => name

export const FileInput = forwardRef<FileInputProps, 'input'>(({ children, ...props }, ref) => {
  const [styles, mergedProps] = useMultiComponentStyle('Input', props)
  const {
    className,
    id,
    name,
    accept,
    multiple,
    form,
    placeholder,
    value,
    defaultValue,
    component,
    format = defaultFormat,
    noOfLines = 1,
    separator = ',',
    resetRef,
    ...rest
  } = useFormControlProps(omitThemeProps(mergedProps))

  const { disabled, readOnly } = rest

  const inputRef = useRef<HTMLInputElement>(null)

  const [values, setValues] = useControllableState({
    value,
    defaultValue,
    onChange: rest.onChange,
  })

  const onClick = useCallback(() => {
    if (disabled || readOnly) return

    inputRef.current?.click()
  }, [disabled, readOnly])

  const onChange = useCallback(
    (ev: ChangeEvent<HTMLInputElement>) => {
      let files = !isNull(ev.currentTarget.files) ? Array.from(ev.currentTarget.files) : null

      if (!files?.length) files = null

      setValues(files)
    },
    [setValues],
  )

  const onReset = useCallback(() => {
    if (inputRef.current) inputRef.current.value = ''

    setValues(null)
  }, [setValues])

  assignRef(resetRef, onReset)

  const cloneChildren = useMemo(() => {
    if (!values?.length) return <ui.span noOfLines={noOfLines}>{placeholder}</ui.span>

    if (children) return children(values)

    if (component) {
      return (
        <ui.span noOfLines={noOfLines}>
          {values.map((value, index) => {
            const el = component({ value, index })

            const style: CSSProperties = {
              marginBlockStart: '0.125rem',
              marginBlockEnd: '0.125rem',
              marginInlineEnd: '0.25rem',
            }

            return el ? cloneElement(el as ReactElement, { style }) : null
          })}
        </ui.span>
      )
    } else {
      return (
        <ui.span noOfLines={noOfLines}>
          {values.map((value, index) => {
            const isLast = values.length === index + 1

            return (
              <ui.span key={index} display='inline-block' me='0.25rem'>
                {format(value, index)}
                {!isLast ? separator : null}
              </ui.span>
            )
          })}
        </ui.span>
      )
    }
  }, [children, format, noOfLines, placeholder, separator, component, values])

  const css: CSSUIObject = {
    display: 'flex',
    alignItems: 'center',
    cursor: !readOnly ? 'pointer' : 'auto',
    ...styles.field,
  }

  return (
    <>
      <ui.input
        ref={mergeRefs(inputRef, ref)}
        type='file'
        tabIndex={-1}
        id={id}
        name={name}
        form={form}
        accept={accept}
        multiple={multiple}
        style={{
          border: '0px',
          clip: 'rect(0px, 0px, 0px, 0px)',
          height: '1px',
          width: '1px',
          margin: '-1px',
          padding: '0px',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          position: 'absolute',
        }}
        onChange={onChange}
        {...pickObject(rest, formControlProperties)}
      />

      <ui.div
        ref={ref}
        className={cx('ui-file-input', className)}
        py={values?.length && component ? '0.125rem' : undefined}
        {...omitObject(rest, ['onChange'])}
        __css={css}
        tabIndex={0}
        data-placeholder={dataAttr(!values?.length)}
        onClick={handlerAll(rest.onClick, onClick)}
      >
        {cloneChildren}
      </ui.div>
    </>
  )
})

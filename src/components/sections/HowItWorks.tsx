import { how } from '@/content/site';
import { Icon } from '../Icon';
import { SectionHead } from '../ui';
import styles from './HowItWorks.module.css';

type BoxProps = {
  x: number;
  y: number;
  w: number;
  h: number;
  title: readonly string[];
  lines: readonly string[];
  accent?: boolean;
};

const TITLE_LINE = 19;
const TEXT_LINE = 17;

/** Блок схемы: заголовок и строки, выровненные по центру по вертикали. */
function DiagramBox({ x, y, w, h, title, lines, accent = false }: BoxProps) {
  const blockHeight = title.length * TITLE_LINE + lines.length * TEXT_LINE;
  const top = y + (h - blockHeight) / 2;
  const textX = x + 12;
  return (
    <g>
      <rect
        x={x + 0.5}
        y={y + 0.5}
        width={w - 1}
        height={h - 1}
        rx={14}
        className={accent ? `${styles.box} ${styles.boxAccent}` : styles.box}
      />
      <text className={styles.boxText}>
        {title.map((line, index) => (
          <tspan key={`t${index}`} x={textX} y={top + 14 + index * TITLE_LINE} className={styles.boxTitle}>
            {line}
          </tspan>
        ))}
        {lines.map((line, index) => (
          <tspan key={`l${index}`} x={textX} y={top + title.length * TITLE_LINE + 12.5 + index * TEXT_LINE}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
}

function Label({ x, y, lines }: { x: number; y: number; lines: readonly string[] | string }) {
  const rows = typeof lines === 'string' ? [lines] : lines;
  return (
    <text className={styles.label} textAnchor="middle">
      {rows.map((row, index) => (
        <tspan key={row} x={x} y={y + index * 16}>
          {row}
        </tspan>
      ))}
    </text>
  );
}

/** Схема «запрос → проверка → модель → проверка → ответ» для экранов от 768 px. */
function FlowDiagram() {
  const d = how.diagram;
  return (
    <svg
      viewBox="0 0 628 472"
      className={styles.diagram}
      role="img"
      aria-labelledby="how-diagram-title"
      aria-describedby="how-diagram-caption"
    >
      <title id="how-diagram-title">Схема работы TrustGuard AI</title>
      <defs>
        <marker id="tg-arrow" orient="auto" markerWidth="5" markerHeight="5" refX="2" refY="2" overflow="visible">
          <path d="M0 0 L4 2 L0 4 Z" fill="#8A84B0" />
        </marker>
      </defs>

      <rect x="200.75" y="0.75" width="214.5" height="470.5" rx="20" className={styles.band} />
      <text x="216" y="31" className={styles.bandTitle}>
        {d.band}
      </text>

      <g className={styles.arrows}>
        <path d="M128 100 H211" markerEnd="url(#tg-arrow)" />
        <path d="M400 100 H483" markerEnd="url(#tg-arrow)" />
        <path d="M488 244 H405" markerEnd="url(#tg-arrow)" />
        <path d="M216 244 H133" markerEnd="url(#tg-arrow)" />
        <path d="M488 396 H405" markerEnd="url(#tg-arrow)" />
        <path d="M308 340 V297" markerEnd="url(#tg-arrow)" />
      </g>

      <DiagramBox x={0} y={52} w={128} h={240} {...d.user} />
      <DiagramBox x={216} y={52} w={184} h={96} accent {...d.checkIn} />
      <DiagramBox x={216} y={196} w={184} h={96} accent {...d.checkOut} />
      <DiagramBox x={216} y={340} w={184} h={112} accent {...d.matrix} />
      <DiagramBox x={488} y={52} w={140} h={240} {...d.model} />
      <DiagramBox x={488} y={320} w={140} h={152} {...d.sources} />

      <Label x={164} y={84} lines={d.labels.request} />
      <Label x={164} y={268} lines={d.labels.show} />
      <Label x={450} y={84} lines={d.labels.passed} />
      <Label x={446} y={268} lines={d.labels.answer} />
      <Label x={446} y={420} lines={d.labels.update} />
      <Label x={346} y={320} lines={d.labels.rules} />
    </svg>
  );
}

export function HowItWorks() {
  return (
    <section id="how" className="card reveal" aria-labelledby="how-title">
      <SectionHead eyebrow={how.eyebrow} title={how.title} titleId="how-title" lead={how.lead} />

      <figure className={styles.figure}>
        <div className={styles.diagramWrap}>
          <FlowDiagram />
        </div>
        <figcaption id="how-diagram-caption" className={styles.caption}>
          {how.caption}
        </figcaption>
      </figure>

      <div className={styles.mobileFlow}>
        <ol className={styles.path} aria-label="Путь запроса и ответа">
          {how.path.map((item, index) => {
            const last = index === how.path.length - 1;
            const check = item.kind === 'check';
            return (
              <li key={item.title} className={styles.pathItem}>
                <div className={styles.rail}>
                  <span className={check ? `${styles.node} ${styles.nodeCheck}` : styles.node} aria-hidden="true">
                    <Icon name={item.icon} />
                  </span>
                  {last ? null : <span className={styles.line} aria-hidden="true" />}
                </div>
                {check ? (
                  <div className={styles.checkCard}>
                    <span className={styles.checkBrand}>TrustGuard AI</span>
                    <span className={styles.pathTitle}>{item.title}</span>
                    <span className={styles.pathText}>{item.text}</span>
                  </div>
                ) : (
                  <div className={styles.pathBody}>
                    <span className={styles.pathTitle}>{item.title}</span>
                    <span className={styles.pathText}>{item.text}</span>
                  </div>
                )}
              </li>
            );
          })}
        </ol>

        <div className={styles.matrixNote}>
          <span className="ico ico-tint" aria-hidden="true">
            <Icon name="matrix" />
          </span>
          <div className={styles.matrixBody}>
            <span className={styles.pathTitle}>{how.matrixNote.title}</span>
            <span className={styles.pathText}>{how.matrixNote.text}</span>
          </div>
        </div>
      </div>

      <ol className={styles.steps}>
        {how.steps.map((step, index) => (
          <li key={step.title} className={`lift ${styles.step}`}>
            <span className={styles.stepNum} aria-hidden="true">
              {index + 1}
            </span>
            <div className={styles.stepBody}>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepText}>{step.text}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className={styles.log}>
        <span className="ico ico-tint" aria-hidden="true">
          <Icon name="log" />
        </span>
        <p className={styles.logText}>{how.log}</p>
      </div>
    </section>
  );
}

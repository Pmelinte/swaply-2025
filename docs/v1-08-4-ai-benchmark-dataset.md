# V1-08.4 — Dataset, gold labels, scoring and benchmark evidence schema

## Control header

| Field | Value |
|---|---|
| Roadmap package | `V1-08` |
| Batch ID | `V1-08.4` |
| Status | `PR_OPEN` |
| Application base SHA | `794f2463b73542e482b22b2a022aa801f4c081b2` |
| Working branch | `v1-08-4-ai-benchmark-dataset` |
| Production target | `https://www.swaply.world` |

## Objective

Construiește contractul versionat și provider-free pentru benchmarkul AI multilingual, fără apeluri externe și fără cost real.

La cererea explicită a lui Petru, datasetul acoperă toate cele 43 de limbi suportate de Swaply. Rularea cu provider real rămâne separată și necesită aprobare explicită.

## Dataset

- versiune: `1.0.0`;
- 43 de limbi, preluate direct din registrul canonic `src/i18n/config.ts`;
- 5 taskuri pentru fiecare limbă;
- 215 cazuri totale;
- ID-uri stabile și unice;
- fixtures sintetice, privacy-safe;
- zero date personale;
- provenance explicit.

### Taskuri incluse

1. `classify_item` — clasificare L1/L2;
2. `describe_item` — descriere localizată și factuală;
3. `translate` — traducere cu păstrarea originalului;
4. `match` — explicație consultativă, fără decizie finală AI;
5. `moderate_chat` — moderare cu graniță umană și controlul fals-pozitivelor.

## Gold labels

Fiecare caz poate fixa:

- categoria L1;
- categoria L2;
- concepte obligatorii;
- concepte interzise;
- obligația de păstrare a textului sursă;
- caracterul exclusiv consultativ;
- eticheta de moderare;
- obligația confirmării umane.

## Scoring

Scorerul determinist măsoară:

- calitatea semantică;
- conformitatea schemei;
- siguranța;
- provenance provider/model;
- granița de confirmare umană;
- latența;
- costul estimat;
- utilizarea fallbackului.

Un caz este PASS numai dacă:

- `qualityScore >= 0.7`;
- schema este validă;
- cerințele de safety sunt respectate;
- providerul și modelul sunt declarate;
- confirmarea umană este expusă când gold label o cere.

## Evidence

Comanda:

```text
npm run eval:ai:v1-08-4
```

produce:

```text
v1-08-4-benchmark-contract-evidence.json
```

Artefactul raportează:

- distribuția cazurilor pe toate cele 43 de limbi;
- distribuția pe taskuri;
- starea privacy-safe;
- dimensiunile pregătite pentru evaluare;
- faptul că provider execution și real cost sunt neautorizate.

## Explicit non-scope

- fără apeluri reale către OpenAI, Anthropic, Gemini sau alt provider;
- fără chei API;
- fără cost real;
- fără modificări DB, migrare, RLS sau RPC;
- fără modificări UI sau business logic;
- fără date Production;
- fără tag, GitHub Release sau `v1.0.0`.

## PASS

- exact 43 de limbi;
- exact 5 taskuri per limbă;
- exact 215 cazuri;
- ID-uri unice;
- toate cazurile sunt privacy-safe;
- gold labels includ granița de confirmare umană;
- scorerul măsoară quality, schema, safety, provenance, human boundary, cost și latență;
- provider execution și real cost rămân `false`;
- CI, AI Evaluation și Vercel Preview sunt verzi;
- zero P0/P1 în review.

## FAIL

- lipsește o limbă sau un task;
- există ID duplicat;
- un fixture conține date personale;
- AI poate lua o decizie finală de matching sau sancționare;
- originalul poate fi pierdut la traducere;
- costul sau providerul sunt activate fără aprobare;
- apare migrare, scriere Production sau defect P0/P1.

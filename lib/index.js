/**
 * 电池续航计算
 *
 * 算设备电池能用多久。输入容量、功耗，或反推需要的电池容量。纯本地计算，不联网。
 */

export const name = "dsh-calc-battery";

export const inject = ["tools"];

const TEXT_OUTPUT = {
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      text: { type: "string" },
    },
    required: ["text"],
  },
  render: (_args, value) => [
    { type: "text", text: (value && value.text) || "" },
  ],
};

// ══════════════════════════════════════════════════════════
//  通用工具函数
// ══════════════════════════════════════════════════════════

const TITLE = "__CALC_TITLE__";

function fmt(n, digits) {
  if (!Number.isFinite(n)) return String(n);
  const d = digits == null ? 2 : digits;
  if (Math.abs(n) >= 1e12) return n.toExponential(6);
  let s = n.toFixed(d);
  if (d > 0) s = s.replace(/0+$/, "").replace(/\.$/, "");
  return s;
}

function money(n) {
  if (!Number.isFinite(n)) return String(n);
  return n.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function num(v, def) {
  const n = Number(v);
  return Number.isFinite(n) ? n : (def == null ? 0 : def);
}

function line(label, value, unit) {
  const pad = "  ";
  return pad + label + "：" + value + (unit ? " " + unit : "");
}

function head(title) {
  return [title, "=".repeat(52)];
}

// ══════════════════════════════════════════════════════════
//  工具
// ══════════════════════════════════════════════════════════

export function apply(ctx, config) {
  void config;

  ctx.tools.register({
    name: "calc_battery",
    description:
      "电池续航计算。输入电池容量（mAh）和设备功耗（mA 或 W），算可用时长。",
    parameters: {
      capacity: { type: "number", required: true, description: "电池容量（mAh）" },
      draw_ma: { type: "number", description: "设备电流（mA）" },
      draw_w: { type: "number", description: "设备功率（W）" },
      voltage: { type: "number", description: "电压（V），默认 3.7" },
    },
    output: TEXT_OUTPUT,
    async execute(args) {
      try {
        const a = args || {};
        const cap = num(a.capacity), v = num(a.voltage, 3.7);
        let ma = num(a.draw_ma);
        if (!ma && num(a.draw_w) > 0) ma = num(a.draw_w) * 1000 / v;
        if (cap <= 0 || ma <= 0) return { text: "容量和功耗要大于 0" };
        const hours = cap / ma;
        const L = head("电池续航");
        L.push(line("容量", fmt(cap, 0) + " mAh"));
        if (num(a.voltage)) L.push(line("电压", fmt(v, 2) + " V"));
        L.push(line("功耗", fmt(ma, 1) + " mA"));
        if (num(a.draw_w)) L.push(line("", fmt(num(a.draw_w), 2) + " W"));
        L.push("");
        L.push(line("理论续航", fmt(hours, 2) + " 小时"));
        L.push(line("即", Math.floor(hours) + " 小时 " + Math.round((hours % 1) * 60) + " 分钟"));
        L.push("");
        L.push("  理论值。实际受温度、老化、放电曲线影响，通常打 8 折。");
        L.push("  实际约 " + fmt(hours * 0.8, 2) + " 小时。");
        return { text: L.join("\n") };
      } catch (e) {
        return { text: "计算失败: " + String((e && e.message) || e) };
      }
    },
  });
}

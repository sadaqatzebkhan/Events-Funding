import { formatCurrency, formatDate } from './formatters';

export function normalizeWhatsAppNumber(rawPhone: string): string {
  if (!rawPhone) return '';
  // Remove all non-digits
  let cleaned = rawPhone.replace(/\D/g, '');

  // Handle standard Pakistani local format 03XXXXXXXXX (11 digits)
  if (cleaned.startsWith('03') && cleaned.length === 11) {
    cleaned = '92' + cleaned.substring(1);
  } else if (cleaned.startsWith('3') && cleaned.length === 10) {
    cleaned = '92' + cleaned;
  } else if (cleaned.startsWith('0092')) {
    cleaned = cleaned.substring(2);
  }

  return cleaned;
}

export type ReminderTemplateType = 'roman_urdu' | 'urdu' | 'english';

export interface ReminderMessageParams {
  memberName: string;
  eventName: string;
  eventDate?: string;
  requiredAmount: number;
  paidAmount: number;
  pendingAmount: number;
}

export function generateReminderMessage(
  template: ReminderTemplateType,
  params: ReminderMessageParams
): string {
  const { memberName, eventName, eventDate, requiredAmount, paidAmount, pendingAmount } = params;
  const formattedDate = formatDate(eventDate);
  const formattedReq = formatCurrency(requiredAmount);
  const formattedPaid = formatCurrency(paidAmount);
  const formattedPending = formatCurrency(pendingAmount);

  if (template === 'roman_urdu') {
    return (
`Assalam-o-Alaikum Respected ${memberName} Bhai/Sahib,

Umeed hai aap khariyat se honge.

Yeh message *Mutual Fund* ki janib se ek mo'addab aur zaroori payment reminder hai:

📌 *Event:* ${eventName}
📅 *Date:* ${formattedDate}
💵 *Kul Muqarrara Raqam (Required):* ${formattedReq}
✅ *Ada Shuda (Paid):* ${formattedPaid}
⏳ *Baqaya Dues (Pending):* *${formattedPending}*

Aap se dili guzarish hai ke event ke intizamat aur akhrajat ko barwaqt aur behtar tareeqe se paya-e-takmeel tak pohanchane ke liye apni pending raqam (*${formattedPending}*) baraye meherbani jald az jald jamah karwa dein.

Mutual Fund me aap ke qeemti taawun aur sath ka bohat shukriya!
JazakAllah Khair!

— *Mutual Fund Administration*`
    );
  }

  if (template === 'urdu') {
    return (
`السلام علیکم محترم ${memberName} صاحب،

امید ہے آپ بخیر و عافیت ہوں گے۔

یہ پیغام *میوچل فنڈ (Mutual Fund)* کی طرف سے ایک شائستہ اور ضروری یاد دہانی (Reminder) ہے۔

📌 *ایونٹ کا نام:* ${eventName}
📅 *تاریخ:* ${formattedDate}
💵 *مقررہ فنڈ (Required):* ${formattedReq}
✅ *ادا شدہ رقم (Paid):* ${formattedPaid}
⏳ *بقیہ واجب الادا رقم (Pending):* *${formattedPending}*

محترم فیملی ممبر، آپ سے مودبانہ گزارش ہے کہ فیملی ایونٹ کے جملہ اخراجات اور بروقت انتظامات کے لیے اپنی بقیہ واجب الادا رقم (*${formattedPending}*) جلد از جلد جمع کروا دیں۔

آپ کے فیملی تعاون اور بروقت شمولیت کا تہہ دل سے شکریہ!
جزاک اللہ خیراً کثیرا۔

— *انتظامیہ: میوچل فنڈ*`
    );
  }

  // English Formal
  return (
`Respected ${memberName},

Greetings of peace and good health.

This is a formal payment reminder from *Mutual Fund* regarding our family event contribution:

📌 *Event:* ${eventName}
📅 *Date:* ${formattedDate}
💵 *Required Contribution:* ${formattedReq}
✅ *Paid so far:* ${formattedPaid}
⏳ *Pending Balance:* *${formattedPending}*

Kindly arrange to clear your pending balance of *${formattedPending}* at your earliest convenience to facilitate timely event arrangements.

Thank you for your valued support and cooperation.

— *Mutual Fund Administration*`
  );
}

export function openWhatsAppDirect(phone: string, text: string): boolean {
  const normalized = normalizeWhatsAppNumber(phone);
  const encodedText = encodeURIComponent(text);
  
  let url = '';
  if (normalized) {
    url = `https://wa.me/${normalized}?text=${encodedText}`;
  } else {
    // If no phone number, open general WhatsApp with text ready to share
    url = `https://wa.me/?text=${encodedText}`;
  }

  // window.open('_blank') silently returns null inside most mobile WebViews (incl. a
  // Flutter webview_flutter host) unless the host explicitly wires up multi-window
  // support. Fall back to a same-context navigation, which every WebView's
  // NavigationDelegate can intercept and hand off to the system WhatsApp app/browser.
  const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
  if (!newWindow) {
    window.location.href = url;
  }
  return !!newWindow;
}

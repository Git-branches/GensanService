-- Frequently asked questions (needs migration 019). English is the source; the other languages are first
-- drafts for native speakers to review. Skips itself if FAQs already exist, so it never overwrites edits.
-- Questions about offline guides and installing the app are added when those features are built.

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS seed_faqs;
DELIMITER //
CREATE PROCEDURE seed_faqs()
BEGIN
  IF (SELECT COUNT(*) FROM faqs) = 0 THEN
    INSERT INTO faqs (id, category, display_order) VALUES
    (1, 'about', 1), (2, 'about', 2), (3, 'about', 3),
    (4, 'guides', 4), (5, 'guides', 5),
    (6, 'directory', 6), (7, 'directory', 7),
    (8, 'accuracy', 8), (9, 'accuracy', 9);

    INSERT INTO faq_translations (faq_id, locale, question, answer) VALUES
    (1, 'en', 'What is Andam GenSan?', 'Andam GenSan is a free, independent guide that helps General Santos City residents prepare before visiting a government office. It shows what to bring, what steps to follow, and where to go. "Andam" is Bisaya for "ready."'),
    (1, 'ceb', 'Unsa ang Andam GenSan?', 'Ang Andam GenSan usa ka libre ug independenteng giya nga motabang sa mga taga-General Santos City nga mangandam sa dili pa moadto sa opisina sa gobyerno. Makita dinhi kung unsay dad-on, unsay mga lakang, ug asa moadto.'),
    (1, 'fil', 'Ano ang Andam GenSan?', 'Ang Andam GenSan ay libre at independiyenteng gabay na tumutulong sa mga residente ng General Santos City na maghanda bago pumunta sa opisina ng gobyerno. Ipinapakita nito kung ano ang dadalhin, ano ang mga hakbang, at saan pupunta. Ang "andam" ay salitang Bisaya para sa "handa."'),
    (1, 'hil', 'Ano ang Andam GenSan?', 'Ang Andam GenSan isa ka libre kag independiente nga giya nga nagabulig sa mga pumuluyo sang General Santos City nga mag-andam antes magkadto sa opisina sang gobyerno. Ginapakita diri kon ano ang dalhon, ano ang mga lakang, kag diin magkadto.'),

    (2, 'en', 'Is Andam GenSan an official government website?', 'No. Andam GenSan is an independent community project. It is not affiliated with any government agency and does not speak for one. Always confirm important details with the agency.'),
    (2, 'ceb', 'Opisyal ba nga website sa gobyerno ang Andam GenSan?', 'Dili. Ang Andam GenSan usa ka independenteng proyekto sa komunidad. Walay kalabotan kini sa bisan unsang ahensya sa gobyerno. Kumpirmaha kanunay sa ahensya ang importanteng detalye.'),
    (2, 'fil', 'Opisyal bang website ng gobyerno ang Andam GenSan?', 'Hindi. Ang Andam GenSan ay independiyenteng proyekto ng komunidad. Wala itong kaugnayan sa anumang ahensya ng gobyerno. Palaging kumpirmahin sa ahensya ang mahahalagang detalye.'),
    (2, 'hil', 'Opisyal bala nga website sang gobyerno ang Andam GenSan?', 'Indi. Ang Andam GenSan isa ka independiente nga proyekto sang komunidad. Wala ini sing kaangtanan sa bisan ano nga ahensya sang gobyerno. Kumpirmaha pirme sa ahensya ang importante nga detalye.'),

    (3, 'en', 'Can I apply or pay through Andam GenSan?', 'No. Andam GenSan only provides information. It does not process applications, book appointments, or accept payments. You apply directly with the agency, online or at its office. Never give anyone your government account passwords or OTPs.'),
    (3, 'ceb', 'Makaaplay o makabayad ba ko pinaagi sa Andam GenSan?', 'Dili. Impormasyon lang ang gihatag sa Andam GenSan. Wala kini nagproseso og aplikasyon, nagpa-appointment, o nagdawat og bayad. Direkta ka nga moaplay sa ahensya, online o sa opisina niini. Ayaw gyud ihatag kang bisan kinsa ang imong password o OTP.'),
    (3, 'fil', 'Puwede ba akong mag-apply o magbayad sa Andam GenSan?', 'Hindi. Impormasyon lang ang ibinibigay ng Andam GenSan. Hindi ito nagpoproseso ng aplikasyon, nag-a-appointment, o tumatanggap ng bayad. Direkta kang mag-apply sa ahensya, online o sa opisina nito. Huwag kailanman ibigay kahit kanino ang iyong password o OTP.'),
    (3, 'hil', 'Pwede bala ako mag-apply ukon magbayad paagi sa Andam GenSan?', 'Indi. Impormasyon lang ang ginahatag sang Andam GenSan. Wala ini nagaproseso sang aplikasyon, nagapa-appointment, ukon nagabaton sang bayad. Direkta ka nga mag-apply sa ahensya, online ukon sa opisina sini. Indi gid paghatag sa bisan sin-o ang imo password ukon OTP.'),

    (4, 'en', 'How do I use a service guide?', 'Search for the service or browse by category or agency, then open its guide. Each guide lists who can apply, the documents to prepare, the steps, and the office to visit. Check the official sources at the end before you go.'),
    (4, 'ceb', 'Unsaon nako paggamit ang giya sa serbisyo?', 'Pangitaa ang serbisyo o tan-awa sumala sa kategorya o ahensya, dayon ablihi ang giya niini. Makita sa matag giya kung kinsa ang pwede mo-apply, ang mga dokumento, ang mga lakang, ug ang opisina nga adtoan. Susiha ang opisyal nga mga tinubdan sa dili pa ka moadto.'),
    (4, 'fil', 'Paano gamitin ang gabay sa serbisyo?', 'Hanapin ang serbisyo o tumingin ayon sa kategorya o ahensya, saka buksan ang gabay nito. Nakalista sa bawat gabay kung sino ang maaaring mag-apply, ang mga dokumento, ang mga hakbang, at ang opisinang pupuntahan. Tingnan ang mga opisyal na sanggunian bago ka pumunta.'),
    (4, 'hil', 'Paano gamiton ang giya sa serbisyo?', 'Pangitaa ang serbisyo ukon tan-awa suno sa kategorya ukon ahensya, dayon buksan ang giya sini. Nakalista sa kada giya kon sin-o ang pwede mag-apply, ang mga dokumento, ang mga lakang, kag ang opisina nga kadtuan. Tan-awa ang mga opisyal nga ginhalinan antes ka magkadto.'),

    (5, 'en', 'How does the document checklist work?', 'Tick each document as you prepare it, and the progress bar shows how many are ready. Your ticks are saved only in the browser on your device, so you do not need an account. They stay there when you come back, and Reset clears them. Finishing the checklist does not guarantee approval.'),
    (5, 'ceb', 'Unsaon paggamit sa checklist sa mga dokumento?', 'Tsekan ang matag dokumento kung andam na, ug ipakita sa progress bar kung pila na ang andam. Sa browser lang sa imong device matipigan ang imong mga tsek, busa dili kinahanglan og account. Magpabilin kini inig balik nimo, ug ang Reset maoy motangtang niini. Ang pagkompleto sa checklist dili garantiya nga maaprobahan.'),
    (5, 'fil', 'Paano gumagana ang checklist ng mga dokumento?', 'Lagyan ng tsek ang bawat dokumento kapag handa na, at ipapakita ng progress bar kung ilan na ang handa. Sa browser lang ng iyong device nase-save ang mga tsek, kaya hindi kailangan ng account. Mananatili ang mga ito pagbalik mo, at binubura ng Reset. Hindi garantiya ng pag-apruba ang pagkumpleto ng checklist.'),
    (5, 'hil', 'Paano nagagana ang checklist sang mga dokumento?', 'Tsekan ang kada dokumento kon handa na, kag ipakita sang progress bar kon pila na ang handa. Sa browser lang sang imo device ginatipigan ang imo mga tsek, gani indi kinahanglan ang account. Magapabilin ini pagbalik mo, kag ang Reset ang magakuha sini. Ang pagkompleto sang checklist indi garantiya nga maaprobahan.'),

    (6, 'en', 'How do I find a government agency?', 'Open Agencies in the menu. Each agency page shows its guides, offices, and any official contact details we have. A label shows whether an office in General Santos City is confirmed, because not every national agency has one.'),
    (6, 'ceb', 'Unsaon nako pagpangita ang ahensya sa gobyerno?', 'Ablihi ang Mga ahensya sa menu. Makita sa panid sa matag ahensya ang mga giya, opisina, ug opisyal nga kontak nga naa namo. Naay label kung nakumpirma ba ang opisina sa General Santos City, kay dili tanang nasyonal nga ahensya naay opisina dinhi.'),
    (6, 'fil', 'Paano maghanap ng ahensya ng gobyerno?', 'Buksan ang Mga ahensya sa menu. Ipinapakita ng pahina ng bawat ahensya ang mga gabay, opisina, at opisyal na contact na mayroon kami. May label kung kumpirmado ang opisina sa General Santos City, dahil hindi lahat ng pambansang ahensya ay may opisina rito.'),
    (6, 'hil', 'Paano mangita sang ahensya sang gobyerno?', 'Buksan ang Mga ahensya sa menu. Ginapakita sang pahina sang kada ahensya ang mga giya, opisina, kag opisyal nga kontak nga yara sa amon. May label kon nakumpirma ang opisina sa General Santos City, kay indi tanan nga nasyonal nga ahensya may opisina diri.'),

    (7, 'en', 'How do I find a government office?', 'Open Offices in the menu to filter offices by name, barangay, or agency. Each office shows the details we have, with Google Maps and Waze links. Offices marked "Details not yet verified" have not been confirmed with the office, so call or check first when you can.'),
    (7, 'ceb', 'Unsaon nako pagpangita ang opisina sa gobyerno?', 'Ablihi ang Mga opisina sa menu aron masala ang mga opisina sumala sa ngalan, barangay, o ahensya. Makita sa matag opisina ang detalye nga naa namo, uban ang link sa Google Maps ug Waze. Ang mga opisina nga naay "Wala pa ma-verify ang detalye" wala pa makumpirma sa opisina, busa tawag o susi una kung mahimo.'),
    (7, 'fil', 'Paano maghanap ng opisina ng gobyerno?', 'Buksan ang Mga opisina sa menu para salain ang mga opisina ayon sa pangalan, barangay, o ahensya. Ipinapakita ng bawat opisina ang detalyeng mayroon kami, kasama ang link sa Google Maps at Waze. Ang mga opisinang may "Hindi pa na-verify ang detalye" ay hindi pa nakukumpirma sa opisina, kaya tumawag o magtanong muna kung maaari.'),
    (7, 'hil', 'Paano mangita sang opisina sang gobyerno?', 'Buksan ang Mga opisina sa menu para salaon ang mga opisina suno sa ngalan, barangay, ukon ahensya. Ginapakita sang kada opisina ang detalye nga yara sa amon, upod ang link sa Google Maps kag Waze. Ang mga opisina nga may "Wala pa na-verify ang detalye" wala pa nakumpirma sa opisina, gani tawag ukon pamangkot anay kon mahimo.'),

    (8, 'en', 'What do the verification labels mean?', 'Verified: our team confirmed the guide against official sources on the date shown. Needs review: the guide was written or changed but is not fully confirmed yet. Not yet verified: no official source has been confirmed. May be outdated: the guide is known to need updating. Whatever the label, confirm with the agency before you go.'),
    (8, 'ceb', 'Unsay kahulogan sa mga label sa pag-verify?', 'Gi-verify: gikumpirma sa among team ang giya batok sa opisyal nga mga tinubdan sa petsa nga gipakita. Kinahanglan susihon: gisulat o giusab ang giya apan wala pa hingpit nga makumpirma. Wala pa ma-verify: walay opisyal nga tinubdan nga nakumpirma. Basin daan na: nahibaw-an nga kinahanglan i-update ang giya. Bisan unsa ang label, kumpirmaha sa ahensya sa dili pa ka moadto.'),
    (8, 'fil', 'Ano ang ibig sabihin ng mga label ng pag-verify?', 'Na-verify: kinumpirma ng aming team ang gabay batay sa mga opisyal na sanggunian sa petsang ipinapakita. Kailangang suriin: isinulat o binago ang gabay pero hindi pa ganap na nakukumpirma. Hindi pa na-verify: walang opisyal na sangguniang nakumpirma. Maaaring luma na: alam na kailangang i-update ang gabay. Anuman ang label, kumpirmahin sa ahensya bago ka pumunta.'),
    (8, 'hil', 'Ano ang kahulugan sang mga label sang pag-verify?', 'Na-verify: ginkumpirma sang amon team ang giya batok sa mga opisyal nga ginhalinan sa petsa nga ginapakita. Kinahanglan susihon: ginsulat ukon ginbag-o ang giya pero wala pa bug-os nga nakumpirma. Wala pa na-verify: wala sing opisyal nga ginhalinan nga nakumpirma. Basi daan na: nahibal-an nga kinahanglan i-update ang giya. Bisan ano ang label, kumpirmaha sa ahensya antes ka magkadto.'),

    (9, 'en', 'How do I report incorrect information?', 'Open the guide and choose "Report incorrect information" near the end of the page. Tell us what is wrong and where you saw the correct details. You do not need an account, and your email is optional. Please do not include ID numbers, passwords, or OTPs.'),
    (9, 'ceb', 'Unsaon nako pag-report sa sayop nga impormasyon?', 'Ablihi ang giya ug pilia ang "I-report ang sayop nga impormasyon" duol sa katapusan sa panid. Isulti kung unsa ang sayop ug asa nimo nakita ang sakto nga detalye. Dili kinahanglan og account, ug dili kinahanglan ang imong email. Palihug ayaw iapil ang ID number, password, o OTP.'),
    (9, 'fil', 'Paano mag-report ng maling impormasyon?', 'Buksan ang gabay at piliin ang "I-report ang maling impormasyon" malapit sa dulo ng pahina. Sabihin kung ano ang mali at kung saan mo nakita ang tamang detalye. Hindi kailangan ng account, at opsyonal ang iyong email. Pakiusap, huwag isama ang ID number, password, o OTP.'),
    (9, 'hil', 'Paano mag-report sang sala nga impormasyon?', 'Buksan ang giya kag pilia ang "I-report ang sala nga impormasyon" malapit sa katapusan sang pahina. Isugid kon ano ang sala kag kon diin mo nakita ang husto nga detalye. Indi kinahanglan ang account, kag opsyonal ang imo email. Palihog indi pag-ilakip ang ID number, password, ukon OTP.');
  END IF;
END //
DELIMITER ;
CALL seed_faqs();
DROP PROCEDURE seed_faqs;

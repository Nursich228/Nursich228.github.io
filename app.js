(function () {
  'use strict';

  /* ===================== ВСПОМОГАТЕЛЬНОЕ ===================== */
  var NL = String.fromCharCode(10);   // перенос строки (клавиша Enter)
  var BS = String.fromCharCode(92);   // обратная косая черта
  var BT = String.fromCharCode(96);   // обратная кавычка
  function $(id) { return document.getElementById(id); }
  function rnd(n) { return Math.floor(Math.random() * n); }
  function pick(a) { return a[rnd(a.length)]; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = rnd(i + 1), x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
  function esc(s) { return String(s).split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;').split('"').join('&quot;'); }
  function isLetter(c) { return !!c && c.toLowerCase() !== c.toUpperCase(); }
  function isCyr(c) { return /[а-яёәіңғүұқөһ]/i.test(c); }
  function isKz(c) { return /[әіңғүұқөһ]/i.test(c); }
  function layoutOf(mode) { return mode === 'ru' || mode === 'kz' ? mode : 'en'; }
  function isLat(c) { return /[a-z]/i.test(c); }
  function onlyFrom(w, set) { for (var k = 0; k < w.length; k++) { if (set.indexOf(w.charAt(k)) < 0) return false; } return true; }
  function hasAny(w, set) { for (var k = 0; k < w.length; k++) { if (set.indexOf(w.charAt(k)) >= 0) return true; } return false; }
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  var isTouch = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
  var PAGE = window.PT_PAGE || {};   // особые страницы: { kind: 'test' } или { kind: 'kz' }
  var TEST_MS = 60000;               // длительность теста скорости

  /* ===================== РАСКЛАДКИ КЛАВИАТУРЫ ===================== */
  // В каждом ряду: [обычные символы, символы с Shift]
  var LAYOUTS = {
    ru: [
      ['ё1234567890-=', 'Ё!"№;%:?*()_+'],
      ['йцукенгшщзхъ' + BS, 'ЙЦУКЕНГШЩЗХЪ/'],
      ['фывапролджэ', 'ФЫВАПРОЛДЖЭ'],
      ['ячсмитьбю.', 'ЯЧСМИТЬБЮ,']
    ],
    kz: [
      ['("әіңғ,.үұқөһ', ')!ӘІҢҒ;:ҮҰҚӨҺ'],
      ['йцукенгшщзхъ' + BS, 'ЙЦУКЕНГШЩЗХЪ/'],
      ['фывапролджэ', 'ФЫВАПРОЛДЖЭ'],
      ['ячсмитьбю№', 'ЯЧСМИТЬБЮ?']
    ],
    en: [
      [BT + '1234567890-=', '~!@#$%^&*()_+'],
      ['qwertyuiop[]' + BS, 'QWERTYUIOP{}|'],
      ['asdfghjkl;' + "'", 'ASDFGHJKL:"'],
      ['zxcvbnm,./', 'ZXCVBNM<>?']
    ]
  };
  // Какой палец нажимает клавишу: l/r — левая/правая рука; p — мизинец, r — безымянный, m — средний, i — указательный
  var FMAP = [
    ['lp', 'lp', 'lr', 'lm', 'li', 'li', 'ri', 'ri', 'rm', 'rr', 'rp', 'rp', 'rp'],
    ['lp', 'lr', 'lm', 'li', 'li', 'ri', 'ri', 'rm', 'rr', 'rp', 'rp', 'rp', 'rp'],
    ['lp', 'lr', 'lm', 'li', 'li', 'ri', 'ri', 'rm', 'rr', 'rp', 'rp'],
    ['lp', 'lr', 'lm', 'li', 'li', 'ri', 'ri', 'rm', 'rr', 'rp']
  ];
  var HOME_KEYS = { ru: ['ф', 'ы', 'в', 'а', 'о', 'л', 'д', 'ж'], kz: ['ф', 'ы', 'в', 'а', 'о', 'л', 'д', 'ж'], en: ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'] };
  var HOME_BUMP = { ru: ['а', 'о'], kz: ['а', 'о'], en: ['f', 'j'] };

  /* ===================== СЛОВА ДЛЯ УПРАЖНЕНИЙ ===================== */
  var WORDS = {
    ru: ('а о да до по ад ар вал вол лад лава лапа папа вода дол дыра дрова фара жар жара жало ждал плов пора рад пар пол пава ода овал права дар ров лов ' +
      'река кора перо поле клад репа кепка крепко жалко палка дело декор ложка лодка кожа корова колода окорок ' +
      'нога нора гора город голова дорога долго рано окно пена полено гонка дракон гнездо огонек ' +
      'шапка каша пушка кошка душа ушко шаг шар уха урок рука дуга кукла лужа пушок ' +
      'щука щека цена овца лещ плащ щенок пицца зона гроза мойка зайка война край рай заноза холод ухо хор хлопок подъезд ' +
      'мама мир мяч мыло мост мел сыр сок суп сон сад сом лес лиса сила тесто тетрадь ' +
      'стол стул книга школа улица дом брат сестра друг кот собака птица рыба солнце небо земля море ' +
      'лето осень зима весна утро день вечер ночь снег дождь ветер облако радуга ' +
      'хлеб молоко яблоко груша слива вишня арбуз дыня морковь чай сахар соль масло мясо рис ' +
      'игра класс ручка парта доска глобус часы время неделя месяц слово буква текст точка ' +
      'работа жизнь свет цвет звук голос песня музыка танец спорт бег прыжок путь машина поезд самолет ' +
      'корабль автобус метро парк цветок дерево трава лист ветка гриб ягода орех мед ' +
      'идти бежать читать писать думать знать видеть слушать играть учить помогать делать говорить смотреть любить жить ' +
      'хороший большой новый старый белый черный красный синий зеленый желтый добрый умный быстрый легкий тихий веселый').split(' '),
    en: ('a as ask all add dad sad lad gas has had hall fall flask glass salad half alas shall flag ' +
      'see sea seed feel fee led red fed desk read dear free tree green keep deep sleep idea field like file side kid lid fire ' +
      'rust trust true tray try yet your you our out put tip toy art star start street story ' +
      'wood word work world power proper quote quick quiet queen people pool open top stop ' +
      'move vote view very van man men moon name more come home game same time make take ' +
      'bank band bring brown begin bone nice nose new now not net never next ' +
      'cat car care city cloud cold code cool cup box fox six mix exit zoo zero zone size lazy ' +
      'the and for are but any can her was one day get him his how boy did its let say she too use mom dog sun run fun big ' +
      'blue black white house water light night right left hand play book door room bird fish milk bread apple happy sunny ' +
      'jumps over type fast slow good great small large first last year week month today friend family school teacher student ' +
      'music ball team win learn help give find think know look want need love live turn show').split(' '),
    kz: 'ана ата апа аға бала қыз ұл әке әже іні аға үй есік терезе мектеп сабақ кітап дәптер қалам мұғалім оқушы дос жол қала ауыл тау өзен көл теңіз орман ағаш гүл шөп жапырақ күн ай жұлдыз аспан жер су от жел қар жаңбыр бұлт таң кеш түн күз қыс көктем жаз нан сүт ет май тұз шай алма жүзім қарбыз қауын бал қант күріш жұмыртқа ит мысық жылқы сиыр қой түйе құс балық аю қасқыр түлкі қоян бүркіт бір екі үш төрт бес алты жеті сегіз тоғыз он жүз мың ақ қара қызыл көк сары жасыл үлкен кіші жақсы жаман әдемі биік ұзын қысқа жылы суық жаңа ескі жас бақытты ақылды батыр мейірімді оқу жазу айту көру келу кету бару жүру отыру тұру ойнау жүгіру ішу жеу ұйықтау сөйлеу тыңдау білу сүю өмір уақыт сағат апта жыл тіл сөз әріп ән күй домбыра ойын еңбек білім ғылым өнер отан ел халық достық бақыт үміт арман жүрек көз қол аяқ бас бет құлақ ауыз тіс шаш киім көйлек етік үстел орындық төсек бөлме ас тамақ дала тас құм өлең ертегі ұшақ пойыз көлік гауһар қаһарман жиһаз шаһар әсем әуен әлем әже өрік өрнек өнім ұя ұлт ұстаз үйрек үкі ірі іс ізет ғажап ғасыр қазақ қымыз қамқор ала алаш алда ал ол оған орда оқы ой ора дала дара жаға жала пара пора лай'.split(' '),
    code: []
  };

  // дополнительные слова — чтобы упражнения не повторялись
  WORDS.ru = WORDS.ru.concat(('авто адрес аист акула альбом ананас апельсин аптека астра атлас бабушка бабочка багаж балкон банан банка баран барабан бассейн батон башня берег береза беседа библиотека билет бинокль блин блокнот блюдо бобер болото борщ ботинок бочка браслет бревно бублик букет бульвар бумага бутерброд вагон валенки ванна варенье ведро великан велосипед верблюд веревка вершина весло взгляд вилка виноград вкус внук вокзал волна ворона ворота восток вратарь выставка галстук гвоздь герой гитара глина гном голубь горка гость грибник грузовик губка гусь дача дверь двор девочка дедушка дельфин деревня джем диван дневник доброта доктор дорожка дружба дуб дятел жаба жасмин железо жираф журнал забор завтрак загадка закат замок записка заяц звонок здание зебра зеркало зонтик игрушка избушка изюм индюк иней искра кабинет кактус калач камень канал капуста карандаш карман картина картошка каток качели квартира кенгуру кефир кино кисть клубника ковер колесо колокол комар комната компот конфета корзина космос костер котенок кофта кошелек кресло крокодил кролик кружка крыльцо кузнечик лагерь лампа ландыш ласточка лебедь лейка лента лестница лимон линейка лисенок листок лошадь луна лыжи магазин малина мальчик марка маска матрешка медведь мелодия мельница метла мечта миска мишка молния мороженое морж мотор муравей мышка набор наушники небосвод носок облако овощи огород огурец одеяло озеро окунь олень орел осина остров отдых отец охота очки палатка пальто памятник панда папка парус паук пенал печенье пирог письмо планета платье пледы площадь подарок подушка поезд полка помидор портфель посуда праздник прогулка пряник птенец пчела пылесос радио ракета ракушка расческа ребенок река ремень речка рисунок роза ромашка рубашка рукавица ручей рюкзак салат самокат сапоги сарай свеча свитер сказка скамейка скрипка слон смех снеговик снежинка сова сосна спичка спутник стакан станция стрекоза страница строитель сумка сундук сыр таблица тарелка телефон тигр толстый торт трактор трамвай трубка тыква удочка улитка урожай утенок учебник учитель фантик фигура флаг фонарь футбол хомяк хоккей художник цапля цирк цыпленок чайник часовщик черепаха чернила чемодан чудо шарик шахматы шишка шоколад шуба щетка экран юла ягненок ящерица ящик бегать верить весело гулять дарить дружить ждать звать искать катать класть кормить лепить летать ловить мечтать мыть нести носить петь плавать прыгать рисовать сидеть спать спешить строить считать танцевать убирать узнать улыбаться ходить шагать шить яркий теплый холодный мокрый сухой сладкий кислый горький чистый грязный светлый темный длинный короткий широкий узкий высокий низкий смелый ловкий сильный слабый вкусный любимый настоящий интересный прекрасный').split(' '));
  WORDS.en = WORDS.en.concat(('able about above after again against along always among animal answer area arm around art asked away baby back bag bake bear beat beautiful became because bed been before began behind being bell below best better between bike bill bird birthday blow board boat body bottle bottom box brave break bright brother build busy buy cake call came camp candy cap card careful carry case catch caught center chair change cheese chicken child children choose circle class clean clear climb clock close cloth clothes coat coffee color come common cook corner cotton could count country cousin cover cow crowd cry cut dance dark daughter dear decide desk dinner direction dish doctor does done draw dream dress drink drive drop dry duck during each early earth easy eat edge egg eight else end enjoy enough even evening ever every example eye face fact fair fall farm father feet fell felt few fight fill final finger finish fire flower fly follow food foot forest forget form forward found four free fresh front fruit full game garden gate gift girl glad glass gold gone grass gray ground group grow guess hair half happen hard hat head hear heart heavy hello hill hold hole holiday hope horse hot hour huge human hungry hurry idea inside island jacket job join joke juice jump just key kind king kitchen kite knee knew lake lamp land language large laugh lead leaf learn least leave less letter life lift line lion list little long lost loud lucky lunch machine magic main map mark market matter maybe meet middle might mind minute mirror miss money monkey morning mother mountain mouse mouth much near neck nest never night nine noise north note nothing notice number ocean office often orange order other outside paint pair paper parent party pass past pay pen pencil picture piece pink place plan plane plant plate please pocket point pond pretty prize problem pull push queen question quiet rabbit race rain rainbow ready reason remember rest rich ring river road rock roof rope round rule safe said sail salt sand save scarf science sea season seat second secret seed sell send seven shape share sheep shell ship shirt shoe shop short shout show shy side sign silver simple sing sister sit size skate sky sleep smile snake snow soft song soon sound soup south space speak special spend spoon spring square stairs stand station stay step stick still stone store storm straight strange strong sugar summer supper sure surprise sweet swim table tail talk tall taste tea team tell ten tent test than thank thing three throw ticket tiger tired together tomorrow tonight tooth top touch tower town toy train travel tree trip truck turtle twelve under until upon useful usual valley village visit voice wait walk wall warm wash watch wave weather wheel where while whole wide wild wind window winter wish without woman wonder wood wool world write wrong yellow young').split(' '));
  ['ru', 'kz', 'en'].forEach(function (m) { WORDS[m] = WORDS[m].filter(function (w, i, a) { return w && a.indexOf(w) === i; }); });

  /* ===================== УРОКИ =====================
     n — название уровня; l — уроки.
     k — новые клавиши (упражнение из букв и слов); rv — повторение;
     w — список слов; s — список предложений; sym — список символов; c — код (каждая строка отдельно);
     t — название урока; cnt — сколько слов/предложений брать */
  var COURSES = {
    ru: [
      { n: { ru: 'Основной ряд', en: 'Home row' }, l: [{ k: 'ао' }, { k: 'вл' }, { k: 'ыд' }, { k: 'фж' }, { k: 'пр' }, { k: 'э' }, { rv: 1 }] },
      { n: { ru: 'Верхний ряд', en: 'Top row' }, l: [{ k: 'ке' }, { k: 'нг' }, { k: 'уш' }, { k: 'цщ' }, { k: 'йз' }, { k: 'хъ' }, { rv: 1 }] },
      { n: { ru: 'Нижний ряд', en: 'Bottom row' }, l: [{ k: 'ми' }, { k: 'ть' }, { k: 'сб' }, { k: 'чю' }, { k: 'я.' }, { rv: 1 }] },
      { n: { ru: 'Слова', en: 'Words' }, l: [
        { t: { ru: 'Короткие слова', en: 'Short words' }, wl: [2, 4], cnt: 34 },
        { t: { ru: 'Средние слова', en: 'Medium words' }, wl: [5, 7], cnt: 28 },
        { t: { ru: 'Длинные слова', en: 'Long words' }, wl: [8, 20], cnt: 20 },
        { t: { ru: 'Любые слова', en: 'Any words' }, wl: [1, 30], cnt: 34 },
        { t: { ru: 'Марафон слов', en: 'Word marathon' }, wl: [1, 30], cnt: 60 }
      ] },
      { n: { ru: 'Заглавные буквы', en: 'Capital letters' }, l: [
        { t: { ru: 'Левая рука', en: 'Left hand' }, w: 'Анна Вика Ева Ирина Карина Маша Света Уля Фаина Яна Айдар Арман Ерлан Ислам Максим Павел Самат Чингиз Аян Ваня Ильяс Камила'.split(' ') },
        { t: { ru: 'Правая рука', en: 'Right hand' }, w: 'Олег Ольга Роман Лена Дина Жанна Эля Нурлан Галина Шамиль Зарина Тимур Борис Юлия Руслан Лейла Дамир Жансая Эрик Нина Оля Гульнара'.split(' ') },
        { t: { ru: 'Города и страны', en: 'Cities and countries' }, w: 'Алматы Астана Шымкент Караганда Актобе Тараз Павлодар Костанай Атырау Туркестан Москва Казахстан Россия Европа Азия Байкал Волга Каспий Алтай Париж Лондон'.split(' ') }
      ] },
      { n: { ru: 'Знаки и цифры', en: 'Punctuation and numbers' }, l: [
        { t: { ru: 'Точка', en: 'Period' }, cnt: 9, s: ['Солнце село за горы.', 'Мы купили новый мяч.', 'На столе лежит книга.', 'Бабушка печет пироги.', 'Утром был туман.', 'Собака спит у двери.', 'Мама мыла раму.', 'Кот спит.', 'Идет дождь.', 'Светит солнце.', 'Я люблю читать.', 'Мы идем в школу.', 'Папа читает газету.', 'Брат играет в мяч.', 'Сегодня тепло.', 'Река быстрая.'] },
        { t: { ru: 'Запятая', en: 'Comma' }, s: ['Утром, днем и вечером я читаю.', 'Яблоки, груши и сливы растут в саду.', 'Если идет дождь, мы сидим дома.', 'Я встал, умылся и сел завтракать.', 'Мама, папа и я гуляем в парке.', 'Зимой холодно, а летом жарко.', 'Когда я вырасту, я стану врачом.', 'Кошка, собака и попугай живут дружно.', 'Летом мы плаваем, загораем и играем в мяч.', 'Если хочешь быстро печатать, тренируйся каждый день.', 'В лесу растут сосны, ели, березы и дубы.', 'Я взял ручку, тетрадь и учебник.'], cnt: 6 },
        { t: { ru: 'Вопрос и восклицание', en: 'Question and exclamation' }, cnt: 9, s: ['Ты любишь мороженое?', 'Какая красивая радуга!', 'Куда ты идешь?', 'Мы победили!', 'Почему небо голубое?', 'Как тебя зовут?', 'Сколько тебе лет?', 'Ура, каникулы!', 'Какой сегодня день?', 'Привет, как дела?', 'Отлично, молодец!', 'Где мой рюкзак?', 'Вперед, к победе!'] },
        { t: { ru: 'Цифры', en: 'Numbers' }, s: ['В классе 25 учеников.', 'Мой дом номер 17.', 'В году 12 месяцев и 365 дней.', 'Урок длится 45 минут.', 'Мне 10 лет, а брату 7.', 'Поезд уходит в 8 часов 30 минут.', 'В неделе 7 дней.', 'У паука 8 ног.', 'В нашем доме 9 этажей.', 'Мы прошли 15 километров.', 'В коробке 24 карандаша.', 'Поезд номер 102 прибывает в 14 часов.'], cnt: 6 }
      ] },
      { n: { ru: 'Тексты', en: 'Texts' }, l: [
        { t: { ru: 'Пословицы', en: 'Proverbs' }, cnt: 7, s: ['Не откладывай на завтра то, что можно сделать сегодня.', 'Семь раз отмерь, один раз отрежь.', 'Ученье свет, а неученье тьма.', 'Дело мастера боится.', 'Под лежачий камень вода не течет.', 'Не имей сто рублей, а имей сто друзей.', 'Слово не воробей, вылетит не поймаешь.', 'Худой мир лучше доброй ссоры.', 'Тише едешь, дальше будешь.', 'Без труда не выловишь и рыбку из пруда.', 'Повторение мать учения.', 'Друг познается в беде.', 'Век живи, век учись.', 'Делу время, потехе час.', 'Терпение и труд все перетрут.', 'Глаза боятся, а руки делают.'] },
        { t: { ru: 'Скороговорки', en: 'Tongue twisters' }, cnt: 5, s: ['Мама мыла Милу мылом.', 'От топота копыт пыль по полю летит.', 'Шесть мышат в камышах шуршат.', 'Три сороки тараторки тараторили на горке.', 'Белые бараны били в барабаны.', 'Шла Саша по шоссе и сосала сушку.', 'Карл у Клары украл кораллы, а Клара у Карла украла кларнет.', 'На дворе трава, на траве дрова.', 'Ехал Грека через реку, видит Грека в реке рак.', 'Корабли лавировали, лавировали, да не вылавировали.'] },
        { t: { ru: 'Все буквы алфавита', en: 'All letters' }, cnt: 2, s: ['Съешь же еще этих мягких французских булок, да выпей чаю.', 'В чащах юга жил бы цитрус? Да, но фальшивый экземпляр!', 'Широкая электрификация южных губерний даст мощный толчок подъему сельского хозяйства.'] }
      ] },
      { n: { ru: 'Рассказы', en: 'Stories' }, l: [
        { t: { ru: 'Утро', en: 'Morning' }, cnt: 1, s: ['Утром Маша проснулась рано. За окном светило солнце и пели птицы. Она быстро умылась, позавтракала и пошла в школу. По дороге она встретила свою подругу Дину, и они весело болтали о каникулах.'] },
        { t: { ru: 'Щенок', en: 'Puppy' }, cnt: 1, s: ['У Тимура есть щенок по имени Барсик. Каждый вечер они гуляют в парке. Барсик любит гоняться за голубями и приносить палку. Когда идет дождь, они сидят дома и смотрят мультфильмы.'] },
        { t: { ru: 'На озере', en: 'At the lake' }, cnt: 1, s: ['Летом наша семья поехала на озеро. Папа ставил палатку, мама готовила обед на костре, а мы с братом ловили рыбу. Вечером мы смотрели на звезды и слушали, как стрекочут кузнечики.'] },
        { t: { ru: 'Зима в горах', en: 'Winter in the mountains' }, cnt: 1, s: ['Зимой в Алматы выпадает много снега. Дети катаются на санках с горки и лепят снеговиков. Горы вокруг города становятся белыми, а воздух чистым и морозным. Вечером так приятно пить горячий чай дома.'] },
        { t: { ru: 'Пчела', en: 'The bee' }, cnt: 1, s: ['Пчела весь день летала с цветка на цветок. Она собирала нектар, чтобы сделать сладкий мед. Вечером пчела вернулась в улей, где ее ждали сестры. Вместе они трудились до самой ночи.'] },
        { t: { ru: 'Библиотека', en: 'Library' }, cnt: 1, s: ['В библиотеке тихо и уютно. На полках стоят тысячи книг: сказки, энциклопедии, рассказы о путешествиях. Можно взять любую книгу домой и читать ее целую неделю, а потом вернуть и выбрать новую.'] },
        { t: { ru: 'Космос', en: 'Space' }, cnt: 1, s: ['Космонавты долго готовятся к полету. Они учатся работать в невесомости, изучают ракету и много занимаются спортом. Первый полет человека в космос состоялся 12 апреля 1961 года, и с тех пор люди мечтают долететь до других планет.'] },
        { t: { ru: 'Слепая печать', en: 'Touch typing' }, cnt: 1, s: ['Компьютер помогает людям работать, учиться и играть. Чтобы печатать быстро, нужно знать, где находятся все буквы. Если заниматься каждый день по десять минут, через месяц руки сами запомнят клавиатуру, и смотреть на нее больше не придется.'] }
      ] }
    ],
    kz: [
      { n: { ru: 'Основной ряд', en: 'Home row' }, l: [{ k: 'ао' }, { k: 'вл' }, { k: 'ыд' }, { k: 'фж' }, { k: 'пр' }, { k: 'э' }, { rv: 1 }] },
      { n: { ru: 'Верхний ряд', en: 'Top row' }, l: [{ k: 'ке' }, { k: 'нг' }, { k: 'уш' }, { k: 'цщ' }, { k: 'йз' }, { k: 'хъ' }, { rv: 1 }] },
      { n: { ru: 'Нижний ряд', en: 'Bottom row' }, l: [{ k: 'ми' }, { k: 'ть' }, { k: 'сб' }, { k: 'чю' }, { k: 'я' }, { rv: 1 }] },
      { n: { ru: 'Казахские буквы', en: 'Kazakh letters' }, l: [{ k: 'әі' }, { k: 'ңғ' }, { k: 'үұ' }, { k: 'қө' }, { k: 'һ' }, { rv: 1 }] },
      { n: { ru: 'Слова', en: 'Words' }, l: [
        { t: { ru: 'Короткие слова', en: 'Short words' }, wl: [2, 4], cnt: 34 },
        { t: { ru: 'Средние слова', en: 'Medium words' }, wl: [5, 7], cnt: 28 },
        { t: { ru: 'Длинные слова', en: 'Long words' }, wl: [8, 20], cnt: 20 },
        { t: { ru: 'Марафон слов', en: 'Word marathon' }, wl: [1, 30], cnt: 60 }
      ] },
      { n: { ru: 'Заглавные буквы', en: 'Capital letters' }, l: [
        { t: { ru: 'Имена', en: 'Names' }, w: 'Айгүл Әсел Нұрлан Ерлан Қанат Ғалым Өмір Ұлжан Әйгерім Жансая Дәулет Бауыржан Сәуле Іңкәр Мұхтар Абай Шоқан Айдос Мәдина Төлеген'.split(' ') },
        { t: { ru: 'Города', en: 'Cities' }, w: 'Алматы Астана Шымкент Тараз Түркістан Қостанай Өскемен Қызылорда Ақтөбе Атырау Павлодар Қарағанды Семей Орал Көкшетау Талдықорған Жезқазған Ақтау'.split(' ') }
      ] },
      { n: { ru: 'Тексты', en: 'Texts' }, l: [
        { t: { ru: 'Предложения', en: 'Sentences' }, cnt: 6, s: ['Мен мектепке барамын.', 'Бүгін ауа райы жақсы.', 'Біз Қазақстанда тұрамыз.', 'Анам маған кітап сыйлады.', 'Алматы әдемі қала.', 'Менің атым Айгүл.', 'Бала доп ойнап жүр.', 'Күн шығып, құстар сайрады.', 'Әкем жұмыстан кеш келді.', 'Біз саябақта серуендедік.', 'Інім сурет салғанды жақсы көреді.', 'Қыста қар көп жауады.'] },
        { t: { ru: 'Пословицы', en: 'Proverbs' }, cnt: 6, s: ['Еңбек етсең ерінбей, тояды қарның тіленбей.', 'Отан оттан да ыстық.', 'Бірлік бар жерде тірлік бар.', 'Оқу инемен құдық қазғандай.', 'Ел іші алтын бесік.', 'Көп сөз көмір, аз сөз алтын.', 'Ақыл жастан, асыл тастан.', 'Жақсы сөз жарым ырыс.', 'Сабыр түбі сары алтын.', 'Досы көпті жау алмайды.', 'Білім таусылмас кен.', 'Кітап білім бұлағы.'] },
        { t: { ru: 'Все казахские буквы', en: 'All Kazakh letters' }, cnt: 1, s: ['Қазақ әліпбиінде ә, ғ, қ, ң, ө, ұ, ү, һ, і әріптері бар.'] }
      ] },
      { n: { ru: 'Рассказы', en: 'Stories' }, l: [
        { t: { ru: 'Таңертең', en: 'Morning' }, cnt: 1, s: ['Таңертең Айдар ерте оянды. Терезеден күн сәулесі түсіп тұр еді. Ол бетін жуып, таңғы асын ішті де, мектепке асықты. Жолда досы Нұрлан кездесіп, екеуі сабақ туралы әңгімелесті.'] },
        { t: { ru: 'Ауылда', en: 'In the village' }, cnt: 1, s: ['Жазғы демалыста біз әжемнің ауылына бардық. Ауылдың маңында биік таулар мен мөлдір өзен бар. Күндіз інім екеуміз жылқы бақтық, ал кешке әжем бізге ертегі айтып берді.'] },
        { t: { ru: 'Кітапхана', en: 'Library' }, cnt: 1, s: ['Кітапханада тыныш әрі жайлы. Сөрелерде мыңдаған кітап тұр: ертегілер, энциклопедиялар, саяхат туралы әңгімелер. Кез келген кітапты үйге алып, бір апта бойы оқуға болады.'] }
      ] }
    ],
    en: [
      { n: { ru: 'Основной ряд', en: 'Home row' }, l: [{ k: 'fj' }, { k: 'dk' }, { k: 'sl' }, { k: 'a;' }, { k: 'gh' }, { rv: 1 }] },
      { n: { ru: 'Верхний ряд', en: 'Top row' }, l: [{ k: 'ei' }, { k: 'ru' }, { k: 'ty' }, { k: 'wo' }, { k: 'qp' }, { rv: 1 }] },
      { n: { ru: 'Нижний ряд', en: 'Bottom row' }, l: [{ k: 'vm' }, { k: 'bn' }, { k: 'c,' }, { k: 'x.' }, { k: 'z/' }, { rv: 1 }] },
      { n: { ru: 'Слова', en: 'Words' }, l: [
        { t: { ru: 'Короткие слова', en: 'Short words' }, wl: [2, 4], cnt: 34 },
        { t: { ru: 'Средние слова', en: 'Medium words' }, wl: [5, 7], cnt: 28 },
        { t: { ru: 'Длинные слова', en: 'Long words' }, wl: [8, 20], cnt: 20 },
        { t: { ru: 'Любые слова', en: 'Any words' }, wl: [1, 30], cnt: 34 },
        { t: { ru: 'Марафон слов', en: 'Word marathon' }, wl: [1, 30], cnt: 60 }
      ] },
      { n: { ru: 'Заглавные буквы', en: 'Capital letters' }, l: [
        { t: { ru: 'Левая рука', en: 'Left hand' }, w: 'Anna Bob Carl David Eva Fred Grace Steve Rose Sara Ted Vera Walter Zack Adam Ben Clara Daisy Ella Greg'.split(' ') },
        { t: { ru: 'Правая рука', en: 'Right hand' }, w: 'John Kate Lily Mike Nick Olivia Paul Henry Ian Ken Leo Mia Noah Oscar Peter Jim Lucy Hugo Molly Nora'.split(' ') },
        { t: { ru: 'Города и дни', en: 'Cities and days' }, w: 'London Paris Tokyo Berlin Madrid Rome Sydney Dubai Almaty Astana Canada Texas Monday Friday Sunday April June English Python Google'.split(' ') }
      ] },
      { n: { ru: 'Знаки и цифры', en: 'Punctuation and numbers' }, l: [
        { t: { ru: 'Точка и запятая', en: 'Period and comma' }, cnt: 7, s: ['The sun is shining, and the birds are singing.', 'Dad made pancakes for breakfast.', 'We need eggs, milk, bread and cheese.', 'My room is small, but it is cozy.','I like apples, pears and plums.', 'My cat is black.', 'We read, write and play.', 'It is sunny today.', 'Tom, Ann and I are friends.', 'The bus is late.', 'First, wash your hands.', 'Our class is big.'] },
        { t: { ru: 'Вопрос и восклицание', en: 'Question and exclamation' }, cnt: 9, s: ['Do you like ice cream?', 'What a beautiful day!', 'Where are you going?', 'We won!', 'Why is the sky blue?', 'How are you?', 'What is your name?', 'Wow, that is great!', 'Can you help me?', 'Where is my bag?', 'Well done!', 'Is it raining?', 'Hurry up!'] },
        { t: { ru: 'Апостроф', en: 'Apostrophe' }, cnt: 6, s: ["I'm happy.", "Don't stop now.", "It's a sunny day.", "We're best friends.", "You can't miss it.", "That's my book.", "Let's play!", "She's very kind."] },
        { t: { ru: 'Цифры', en: 'Numbers' }, cnt: 4, s: ['I have 3 cats and 2 dogs.', 'School starts at 8:30.', 'A year has 365 days.', 'There are 24 hours in a day.', 'My brother is 12.', 'Room 404 is closed.', 'We need 10 apples.', 'The game ends at 7:45.'] }
      ] },
      { n: { ru: 'Тексты', en: 'Texts' }, l: [
        { t: { ru: 'Пословицы', en: 'Proverbs' }, cnt: 6, s: ['The early bird catches the worm.', 'Two heads are better than one.', 'Look before you leap.', 'Great minds think alike.', 'Time is money.', 'Practice makes perfect.', 'Slow and steady wins the race.', 'Better late than never.', 'Actions speak louder than words.', 'Knowledge is power.', 'Where there is a will, there is a way.', 'Every day is a new start.'] },
        { t: { ru: 'Скороговорки', en: 'Tongue twisters' }, cnt: 3, s: ['She sells sea shells by the sea shore.', 'Peter Piper picked a peck of pickled peppers.', 'How much wood would a woodchuck chuck?', 'Red lorry, yellow lorry.', 'Fresh fried fish, fish fresh fried.'] },
        { t: { ru: 'Все буквы алфавита', en: 'All letters' }, cnt: 2, s: ['The quick brown fox jumps over the lazy dog.', 'Sphinx of black quartz, judge my vow.', 'How vexingly quick daft zebras jump!', 'The five boxing wizards jump quickly.'] }
      ] },
      { n: { ru: 'Рассказы', en: 'Stories' }, l: [
        { t: { ru: 'Прогулка с собакой', en: 'Dog walk' }, cnt: 1, s: ['Every morning Tom walks his dog in the park. The dog loves to run after the ball and bark at the birds. After the walk they go home and have breakfast together. Then Tom goes to school and the dog sleeps on the sofa.'] },
        { t: { ru: 'Как велосипед', en: 'Like a bike' }, cnt: 1, s: ['Learning to type is like learning to ride a bike. At first it feels slow and hard, but every day it gets a little easier. Soon your fingers will find the keys on their own, and you will not need to look down at all.'] },
        { t: { ru: 'Библиотека', en: 'Library' }, cnt: 1, s: ['The library is a quiet place full of books. You can read about space, animals, history and faraway countries. If you like a book, you can take it home for a week and then come back for a new one.'] },
        { t: { ru: 'Поход', en: 'Camping' }, cnt: 1, s: ['In summer our family went camping by the lake. Dad set up the tent, Mom cooked dinner on the fire, and my sister and I went fishing. At night we watched the stars and listened to the crickets.'] },
        { t: { ru: 'Программист', en: 'Programmer' }, cnt: 1, s: ['Computers help people work, learn and play. A good programmer writes clean code and tests it often. Typing fast saves a lot of time when you write programs every day, so it is worth practicing a little each morning.'] },
        { t: { ru: 'Пчела', en: 'The bee' }, cnt: 1, s: ['The little bee flew from flower to flower all day long. It collected nectar to make sweet honey. In the evening it returned to the hive, tired but happy, and told the other bees where the best flowers were.'] }
      ] }
    ],
    code: [
      { n: { ru: 'Символы', en: 'Symbols' }, l: [
        { t: { ru: 'Скобки', en: 'Brackets' }, sym: ['()', '[]', '{}', '<>', '( )', '[ ]', '{ }', 'f()', 'a[0]', '{a}', '<b>', '(x)'] },
        { t: { ru: 'Операторы', en: 'Operators' }, sym: ['=', '==', '!=', '+=', '-=', '=>', '->', '<=', '>=', '&&', '||', '++', '--', '*', '/', '%'] },
        { t: { ru: 'Кавычки и знаки', en: 'Quotes and signs' }, sym: ['"text"', "'a'", '_name', 'my_var', 'a.b', 'obj.key', '#id', '.class', '@user', '$price', 'x: 1', 'a; b;'] }
      ] },
      { n: { ru: 'Ключевые слова', en: 'Keywords' }, l: [
        { t: { ru: 'Основные', en: 'Basics' }, w: ['if', 'else', 'for', 'while', 'return', 'true', 'false', 'null', 'break', 'continue', 'and', 'or', 'not', 'in', 'is'] },
        { t: { ru: 'JavaScript', en: 'JavaScript' }, w: ['function', 'const', 'let', 'var', 'class', 'import', 'export', 'from', 'new', 'this', 'async', 'await', 'try', 'catch', 'throw', 'switch', 'case', 'default', 'typeof', 'console.log'] },
        { t: { ru: 'Python', en: 'Python' }, w: ['def', 'print', 'input', 'range', 'len', 'list', 'dict', 'str', 'int', 'float', 'self', 'None', 'True', 'False', 'elif', 'lambda', 'import', 'return', 'yield', 'with', 'pass'] },
        { t: { ru: 'Все вперемешку', en: 'Mixed' }, wl: [1, 40], cnt: 30 },
        { t: { ru: 'Выражения', en: 'Expressions' }, cnt: 16, w: ['x = 1', 'i++', 'a + b', 'n * 2', 'len(s)', 'f(x)', 'arr[0]', 'obj.name', 'x == y', 'a != b', 'i < n', 'return x;', 'i += 1', 'x > 0'] }
      ] },
      { n: { ru: 'Python', en: 'Python' }, l: [
        { t: { ru: 'Функция', en: 'Function' }, c: ['def greet(name):', '    return "Hello, " + name', '', 'print(greet("World"))'] },
        { t: { ru: 'Цикл for', en: 'For loop' }, c: ['numbers = [1, 2, 3, 4, 5]', 'total = 0', 'for n in numbers:', '    total += n', 'print(total)'] },
        { t: { ru: 'Условие', en: 'Condition' }, c: ['age = int(input("Age: "))', 'if age >= 18:', '    print("Adult")', 'else:', '    print("Child")'] },
        { t: { ru: 'Класс', en: 'Class' }, c: ['class Cat:', '    def __init__(self, name):', '        self.name = name', '', '    def say(self):', '        return "Meow! I am " + self.name'] },
        { t: { ru: 'Списки', en: 'Lists' }, c: ['squares = [x * x for x in range(10)]', 'evens = [x for x in squares if x % 2 == 0]', 'print(evens)'] },
        { t: { ru: 'Словарь', en: 'Dictionary' }, c: ['ages = {"Ann": 12, "Tom": 10}', 'ages["Kate"] = 11', 'for name, age in ages.items():', '    print(name, "is", age)'] },
        { t: { ru: 'Цикл while', en: 'While loop' }, c: ['count = 3', 'while count > 0:', '    print(count)', '    count -= 1', 'print("Go!")'] },
        { t: { ru: 'Файл', en: 'File' }, c: ['with open("notes.txt") as f:', '    for line in f:', '        print(line.strip())'] }
      ] },
      { n: { ru: 'JavaScript', en: 'JavaScript' }, l: [
        { t: { ru: 'Функция', en: 'Function' }, c: ['function sum(a, b) {', '  return a + b;', '}', 'console.log(sum(2, 3));'] },
        { t: { ru: 'Массив', en: 'Array' }, c: ['const fruits = ["apple", "banana", "cherry"];', 'fruits.forEach((fruit) => {', '  console.log(fruit);', '});'] },
        { t: { ru: 'Объект и условие', en: 'Object and if' }, c: ['const user = { name: "Ann", age: 12 };', 'if (user.age >= 18) {', '  console.log("adult");', '} else {', '  console.log("child");', '}'] },
        { t: { ru: 'Событие клика', en: 'Click event' }, c: ['let count = 0;', 'const button = document.querySelector("#btn");', 'button.addEventListener("click", () => {', '  count++;', '});'] },
        { t: { ru: 'Async / await', en: 'Async / await' }, c: ['async function load(url) {', '  const res = await fetch(url);', '  return res.json();', '}'] },
        { t: { ru: 'Map и filter', en: 'Map and filter' }, c: ['const nums = [1, 2, 3, 4, 5, 6];', 'const even = nums.filter((n) => n % 2 === 0);', 'const doubled = even.map((n) => n * 2);', 'console.log(doubled);'] },
        { t: { ru: 'Класс', en: 'Class' }, c: ['class Dog {', '  constructor(name) {', '    this.name = name;', '  }', '  bark() {', '    return this.name + " says woof";', '  }', '}'] },
        { t: { ru: 'Цикл for', en: 'For loop' }, c: ['for (let i = 1; i <= 5; i++) {', '  console.log("Step " + i);', '}'] }
      ] },
      { n: { ru: 'HTML и CSS', en: 'HTML and CSS' }, l: [
        { t: { ru: 'Страница', en: 'Page' }, c: ['<!DOCTYPE html>', '<html>', '  <body>', '    <h1>Hello!</h1>', '    <p>My first page.</p>', '  </body>', '</html>'] },
        { t: { ru: 'Меню', en: 'Menu' }, c: ['<ul class="menu">', '  <li><a href="/">Home</a></li>', '  <li><a href="/about">About</a></li>', '</ul>'] },
        { t: { ru: 'Стили кнопки', en: 'Button styles' }, c: ['.button {', '  color: white;', '  background: #2f6fed;', '  padding: 8px 16px;', '  border-radius: 6px;', '}'] },
        { t: { ru: 'Форма', en: 'Form' }, c: ['<form>', '  <input type="text" placeholder="Name">', '  <button type="submit">Send</button>', '</form>'] }
      ] },
      { n: { ru: 'SQL и терминал', en: 'SQL and terminal' }, l: [
        { t: { ru: 'Выборка SELECT', en: 'SELECT query' }, c: ['SELECT name, age', 'FROM users', 'WHERE age > 18', 'ORDER BY name;'] },
        { t: { ru: 'Вставка INSERT', en: 'INSERT query' }, c: ['INSERT INTO users (name, age)', "VALUES ('Ann', 12);"] },
        { t: { ru: 'Git', en: 'Git' }, c: ['git init', 'git add .', 'git commit -m "first commit"', 'git push origin main'] },
        { t: { ru: 'Команды терминала', en: 'Terminal commands' }, c: ['cd projects', 'mkdir my-site', 'cd my-site', 'npm install', 'npm run dev'] }
      ] }
    ]
  };

  /* ===================== ТЕКСТЫ ИНТЕРФЕЙСА ===================== */
  var T = {
    ru: {
      title: 'PracticeTap — тренажер слепой печати онлайн: русский, английский и код',
      tagline: 'тренажер слепой печати', modeRu: 'Русский', modeEn: 'English', modeCode: 'Код',
      g1: 'Выбери язык и урок', g2: 'Поставь пальцы, как на картинке внизу', g3: 'Печатай подсвеченную букву, не глядя на клавиатуру',
      level: 'Уровень', keys: 'Буквы', review: 'Повторение', special: 'Особое задание',
      speed: 'зн/мин', acc: 'точность', errors: 'ошибки', time: 'время',
      restart: 'Заново', custom: 'Свой текст', keyboard: 'Клавиатура',
      startPre: 'Начни печатать →', startPost: 'Таймер включится сам. Esc — закончить урок и посмотреть результат.',
      press: 'Нажми', hold: 'Зажми', and: 'и нажми', space: 'пробел',
      fingers: { lp: 'левый мизинец', lr: 'левый безымянный', lm: 'левый средний', li: 'левый указательный', ri: 'правый указательный', rm: 'правый средний', rr: 'правый безымянный', rp: 'правый мизинец', th: 'большой палец' },
      caps: 'Выключи Caps Lock — сейчас все буквы печатаются заглавными',
      toRu: 'Включена английская раскладка. Переключи на русскую: Alt+Shift или Win+Пробел (Windows), Ctrl+Пробел (Mac)',
      toEn: 'Включена русская раскладка. Переключи на английскую: Alt+Shift или Win+Пробел (Windows), Ctrl+Пробел (Mac)',
      tap: 'Нажми на текст, чтобы открыть клавиатуру',
      lg1: 'мизинцы', lg2: 'безымянные', lg3: 'средние', lg4: 'указательные', lg5: 'большие — пробел', left: 'левая', right: 'правая',
      statsTitle: 'Моя статистика', lessonsDone: 'уроков пройдено', best: 'лучшая скорость', typed: 'знаков напечатано',
      errTitle: 'Где больше всего ошибок', errNote: 'Цвет полоски — палец, которым нажимается клавиша.', noErr: 'Ошибок пока нет — так держать!',
      trouble: 'Тренировать трудные буквы', troubleTitle: 'Трудные буквы',
      troubleEmpty: 'Сначала пройди пару уроков — тогда здесь появятся буквы, на которых ты ошибаешься.',
      reset: 'Сбросить статистику', resetSure: 'Нажми еще раз, чтобы сбросить',
      res1: 'Неплохо! Попробуй еще раз — получится лучше.', res2: 'Хорошо! До трех звезд совсем чуть-чуть.', res3: 'Супер! Отличная точность!',
      starsNote: 'Звезды даются за точность: 98% и выше — три звезды, 93% и выше — две.',
      cpmShort: 'зн/мин', wpmNote: 'слов/мин', resErr: 'Ошибки в этом уроке', again: 'Еще раз', next: 'Дальше',
      customTitle: 'Свой текст', customHelp: 'Вставь любой текст: стихотворение, домашнее задание или код. Переносы строк сохранятся.',
      customPh: 'Например: Мороз и солнце, день чудесный!', customGo: 'Печатать', cancel: 'Отмена',
      footerPrivacy: 'Политика конфиденциальности',
      themeTip: 'Светлая или темная тема', soundTip: 'Сигнал при ошибке', focusTip: 'Во время печати прячет все лишнее',
      langTip: 'Язык сайта', kbTip: 'Показать или скрыть клавиатуру и руки', focus: 'Фокус', sound: 'Звук', settingsTip: 'Настройки',
      goStart: 'Начать', goContinue: 'Продолжить', lessonWord: 'Урок', of: 'из', pickHint: 'Выбрать другой урок',
      fbTitle: 'Помогите нам стать лучше', fbText: 'Напиши, что добавить или исправить, — разработчик прочитает каждое сообщение.',
      likeQ: 'Нравится сайт?', likeYes: 'Нравится', likeNo: 'Не нравится', ideaQ: 'Есть идея или нашли ошибку?',
      voteThanks: 'Спасибо за оценку!', voteErr: 'Не получилось отправить оценку. Попробуй позже.',
      fbHide: 'Скрыть этот блок', rateSite: 'Оценить сайт',
      fbBtn: 'Предложить идею', fbHelp: 'Напиши свое предложение. После нажатия «Отправить» откроется почта с готовым письмом. Если почта не открылась, напиши на dester1310@gmail.com.',
      fbPh: 'Например: добавьте уроки на казахском языке', fbSend: 'Отправить', fbSubject: 'PracticeTap: предложение',
      resStop: 'Урок остановлен. Вот что получилось:',
      modeKz: 'Қазақша', toKz: 'Включи казахскую раскладку. Windows: Alt+Shift или Win+Пробел. Mac: Ctrl+Пробел (раскладку «Казахская» сначала добавь в настройках клавиатуры)',
      testTitle: 'Тест скорости печати', testSub: '1 минута', testGo: 'Начать тест', testAgain: 'Новый тест',
      testDone: 'Время вышло! Вот твоя скорость:', testBest: 'Твой лучший результат', testLeft: 'осталось',
      testPick: 'Тест на 1 минуту: печатай слова, пока идет таймер',
      navMain: 'Тренажер', navTest: 'Тест скорости печати', navKz: 'Казахская раскладка'
    },
    en: {
      title: 'PracticeTap — free online touch typing trainer: Russian, English and code',
      tagline: 'touch typing trainer', modeRu: 'Russian', modeEn: 'English', modeCode: 'Code',
      g1: 'Pick a language and a lesson', g2: 'Place your fingers like in the picture below', g3: 'Type the glowing letter without looking at the keyboard',
      level: 'Level', keys: 'Keys', review: 'Review', special: 'Special task',
      speed: 'WPM', acc: 'accuracy', errors: 'mistakes', time: 'time',
      restart: 'Restart', custom: 'My text', keyboard: 'Keyboard',
      startPre: 'Start typing →', startPost: 'The timer starts by itself. Esc — stop and see your result.',
      press: 'Press', hold: 'Hold', and: 'and press', space: 'space',
      fingers: { lp: 'left pinky', lr: 'left ring finger', lm: 'left middle finger', li: 'left index finger', ri: 'right index finger', rm: 'right middle finger', rr: 'right ring finger', rp: 'right pinky', th: 'thumb' },
      caps: 'Turn off Caps Lock — all letters come out as capitals',
      toRu: 'The English layout is on. Switch to Russian: Alt+Shift or Win+Space (Windows), Ctrl+Space (Mac)',
      toEn: 'The Russian layout is on. Switch to English: Alt+Shift or Win+Space (Windows), Ctrl+Space (Mac)',
      tap: 'Tap the text to open the keyboard',
      lg1: 'pinkies', lg2: 'ring fingers', lg3: 'middle fingers', lg4: 'index fingers', lg5: 'thumbs — space', left: 'left', right: 'right',
      statsTitle: 'My stats', lessonsDone: 'lessons done', best: 'best speed', typed: 'characters typed',
      errTitle: 'Where you make the most mistakes', errNote: 'Bar colour shows the finger that presses the key.', noErr: 'No mistakes yet — keep it up!',
      trouble: 'Practise tricky keys', troubleTitle: 'Tricky keys',
      troubleEmpty: 'Finish a couple of lessons first — then the keys you miss most will show up here.',
      reset: 'Reset stats', resetSure: 'Click again to reset',
      res1: 'Not bad! Try again — you will do better.', res2: 'Good job! Almost three stars.', res3: 'Awesome! Great accuracy!',
      starsNote: 'Stars are for accuracy: 98% or more gives three stars, 93% or more gives two.',
      cpmShort: 'chars/min', wpmNote: 'words/min', resErr: 'Mistakes in this lesson', again: 'Try again', next: 'Next',
      customTitle: 'My text', customHelp: 'Paste any text: a poem, homework or code. Line breaks are kept.',
      customPh: 'For example: The early bird catches the worm.', customGo: 'Start typing', cancel: 'Cancel',
      footerPrivacy: 'Privacy policy',
      themeTip: 'Light or dark theme', soundTip: 'Beep on mistakes', focusTip: 'Hides everything extra while you type',
      langTip: 'Site language', kbTip: 'Show or hide the keyboard and hands', focus: 'Focus', sound: 'Sound', settingsTip: 'Settings',
      goStart: 'Start', goContinue: 'Continue', lessonWord: 'Lesson', of: 'of', pickHint: 'Pick another lesson',
      fbTitle: 'Help us get better', fbText: 'Tell us what to add or fix — the developer reads every message.',
      likeQ: 'Do you like the site?', likeYes: 'I like it', likeNo: 'Not really', ideaQ: 'Have an idea or found a bug?',
      voteThanks: 'Thanks for your vote!', voteErr: 'Could not send your vote. Please try again later.',
      fbHide: 'Hide this block', rateSite: 'Rate the site',
      fbBtn: 'Suggest an idea', fbHelp: 'Write your suggestion. After you press Send, your email app opens with a ready message. If it does not open, write to dester1310@gmail.com.',
      fbPh: 'For example: add lessons in Kazakh', fbSend: 'Send', fbSubject: 'PracticeTap: suggestion',
      resStop: 'Lesson stopped. Here is how you did:',
      modeKz: 'Kazakh', toKz: 'Switch to the Kazakh layout. Windows: Alt+Shift or Win+Space. Mac: Ctrl+Space (add the Kazakh layout in keyboard settings first)',
      testTitle: 'Typing speed test', testSub: '1 minute', testGo: 'Start test', testAgain: 'New test',
      testDone: 'Time is up! Here is your speed:', testBest: 'Your best result', testLeft: 'left',
      testPick: '1-minute test: type the words while the timer runs',
      navMain: 'Trainer', navTest: 'Typing speed test', navKz: 'Kazakh layout'
    }
  };

  /* ===================== СОСТОЯНИЕ ===================== */
  var S = {
    ui: store.get('pt_ui', 'ru'),   // язык интерфейса: по умолчанию русский, английский — по кнопке RU/EN
    saved: store.get('pt_pos', {}),
    prog: store.get('pt_prog', {}),
    stats: store.get('pt_stats', {}),
    sound: store.get('pt_sound', false),
    focus: store.get('pt_focus', true),
    kb: store.get('pt_kb', true),
    mode: 'ru', lv: 0, i: 0, special: null, layout: null,
    text: '', block: false, spans: [], at: 0, curEl: null,
    correct: 0, errors: 0, errMap: {}, wrong: {},
    started: false, done: false, t0: 0, tEnd: 0, timer: null,
    warn: '', caps: false, modal: null, onEls: [], mouse: 0,
    keyMap: {}, shiftL: null, shiftR: null, fingerEls: []
  };
  if (S.ui !== 'ru' && S.ui !== 'en') S.ui = 'ru';
  function t(key) { var v = T[S.ui][key]; return v === undefined ? T.ru[key] : v; }

  /* какой палец нажимает символ (для диаграммы ошибок) */
  var FINGER_OF = { ru: {}, kz: {}, en: {} };
  ['ru', 'kz', 'en'].forEach(function (ln) {
    LAYOUTS[ln].forEach(function (row, r) {
      for (var c = 0; c < row[0].length; c++) { FINGER_OF[ln][row[0].charAt(c)] = FMAP[r][c]; FINGER_OF[ln][row[1].charAt(c)] = FMAP[r][c]; }
    });
    FINGER_OF[ln][' '] = 'th';
    FINGER_OF[ln][NL] = 'rp';
  });
  COURSES.code.forEach(function (lv) { lv.l.forEach(function (L) { WORDS.code = WORDS.code.concat(L.w || L.sym || []); }); });

  /* ===================== ГЕНЕРАЦИЯ ТЕКСТА УРОКА ===================== */
  function learnedKeys(mode, lv, i) {
    var C = COURSES[mode], s = '';
    for (var a = 0; a <= lv; a++) {
      for (var b = 0; b < C[a].l.length; b++) {
        if (a === lv && b > i) break;
        if (C[a].l[b].k) s += C[a].l[b].k;
      }
    }
    return s;
  }
  function group(newK, all) {
    var len = 2 + rnd(3), g = '';
    for (var k = 0; k < len; k++) { var pool = Math.random() < 0.6 ? newK : all; g += pool.charAt(rnd(pool.length)); }
    return g;
  }
  function drillText(mode, newK, all, review) {
    var words = WORDS[mode].filter(function (w) { return onlyFrom(w, all); });
    var pool = review ? words : words.filter(function (w) { return hasAny(w, newK); });
    var useW = pool.length >= (review ? 6 : 3);
    var items = [], prev = '';
    for (var n = 0; n < 28; n++) {
      var it = (useW && (review || Math.random() < 0.45)) ? pick(pool) : group(newK, all);
      if (it === prev) it = group(newK, all);
      items.push(it); prev = it;
    }
    return items.join(' ');
  }
  function wordsText(list, n) {
    var out = [], prev = '';
    while (out.length < n) { var w = pick(list); if (w === prev && list.length > 1) continue; out.push(w); prev = w; }
    return out.join(' ');
  }
  function makeText(mode, lv, i) {
    var L = COURSES[mode][lv].l[i];
    if (L.c) return { text: L.c.join(NL), block: true };
    if (L.k || L.rv) { var all = learnedKeys(mode, lv, i); return { text: drillText(mode, L.k || all, all, !!L.rv), block: false }; }
    if (L.s) return { text: shuffle(L.s).slice(0, L.cnt || 4).join(' '), block: false };
    if (L.w) return { text: wordsText(L.w, L.cnt || 24), block: false };
    if (L.sym) return { text: wordsText(L.sym, L.cnt || 24), block: false };
    if (L.wl) {
      var pool = WORDS[mode].filter(function (w) { return w.length >= L.wl[0] && w.length <= L.wl[1]; });
      return { text: wordsText(pool, L.cnt || 28), block: false };
    }
    return { text: '...', block: false };
  }
  function lessonTitle(mode, lv, i) {
    var L = COURSES[mode][lv].l[i];
    if (L.t) return L.t[S.ui];
    if (L.k) return t('keys') + ' ' + L.k.toUpperCase().split('').join(' ');
    return t('review');
  }

  /* ===================== КЛАВИАТУРА НА ЭКРАНЕ ===================== */
  function makeKey(row, w, f) {
    var el = document.createElement('div');
    el.className = 'key f-' + f;
    el.style.width = 'calc(var(--u) * ' + w + ' + var(--g) * ' + (w - 1) + ')';
    row.appendChild(el);
    return el;
  }
  function addMod(row, m) {
    var el = makeKey(row, m[1], m[2]);
    el.classList.add('mod');
    el.textContent = m[0];
    if (m[3] === NL) S.keyMap[NL] = { el: el, f: 'rp', shift: false };
    if (m[3] === 'L') S.shiftL = el;
    if (m[3] === 'R') S.shiftR = el;
  }
  function buildKeyboard() {
    var L = LAYOUTS[S.layout], kb = $('kb');
    kb.innerHTML = '';
    S.keyMap = {};
    S.onEls = [];
    var mods = [
      [null, ['⌫', 2, 'rp']],
      [['Tab', 1.5, 'lp'], null],
      [['Caps', 1.75, 'lp'], ['Enter ↵', 2.25, 'rp', NL]],
      [['Shift', 2.25, 'lp', 'L'], ['Shift', 2.75, 'rp', 'R']]
    ];
    for (var r = 0; r < 4; r++) {
      var row = document.createElement('div');
      row.className = 'krow';
      if (mods[r][0]) addMod(row, mods[r][0]);
      var base = L[r][0], sh = L[r][1];
      for (var c = 0; c < base.length; c++) {
        var b = base.charAt(c), s = sh.charAt(c), f = FMAP[r][c];
        var el = makeKey(row, (r === 1 && c === base.length - 1) ? 1.5 : 1, f);
        if (b === 'ё') el.textContent = '';   // клавишу с этой буквой показываем пустой
        else if (isLetter(b)) el.textContent = b.toUpperCase();
        else el.innerHTML = '<span class="sub">' + esc(s) + '</span>' + esc(b);
        if (HOME_BUMP[S.layout].indexOf(b) >= 0) el.classList.add('bump');
        S.keyMap[b] = { el: el, f: f, shift: false };
        if (s && s !== b) S.keyMap[s] = { el: el, f: f, shift: true };
      }
      if (mods[r][1]) addMod(row, mods[r][1]);
      kb.appendChild(row);
    }
    var srow = document.createElement('div');
    srow.className = 'krow';
    var sp = makeKey(srow, 6.25, 'th');
    sp.classList.add('mod');
    sp.textContent = t('space');
    S.keyMap[' '] = { el: sp, f: 'th', shift: false };
    kb.appendChild(srow);
  }

  /* ===================== КАРТИНКА РУК ===================== */
  // [палец, x, y, высота] для левой руки; правая рисуется зеркально
  var HAND = [['lp', 44, 78, 84], ['lr', 90, 46, 116], ['lm', 136, 32, 130], ['li', 182, 48, 114]];
  function buildHands() {
    var W = 640, FW = 40, out = '';
    function finger(id, x, y, h) {
      return '<g class="fg f-' + id + '" data-f="' + id + '"><rect x="' + x + '" y="' + y + '" width="' + FW + '" height="' + h + '" rx="20"/></g>';
    }
    var rid = ['rp', 'rr', 'rm', 'ri'];
    for (var k = 0; k < 4; k++) {
      var h = HAND[k];
      out += finger(h[0], h[1], h[2], h[3]);
      out += finger(rid[k], W - h[1] - FW, h[2], h[3]);
    }
    out += '<g class="fg f-th" data-f="th"><rect x="222" y="128" width="40" height="96" rx="20" transform="rotate(42 242 176)"/></g>';
    out += '<g class="fg f-th" data-f="th"><rect x="' + (W - 262) + '" y="128" width="40" height="96" rx="20" transform="rotate(-42 ' + (W - 242) + ' 176)"/></g>';
    out += '<rect class="palm" x="38" y="132" width="200" height="104" rx="48"/>';
    out += '<rect class="palm" x="' + (W - 238) + '" y="132" width="200" height="104" rx="48"/>';
    out += '<text class="palm-t" x="138" y="200">' + esc(t('left')) + '</text>';
    out += '<text class="palm-t" x="' + (W - 138) + '" y="200">' + esc(t('right')) + '</text>';
    $('hands').innerHTML = out;
    S.fingerEls = $('hands').querySelectorAll('.fg');
  }

  /* ===================== ПОДСВЕТКА И ПОДСКАЗКА ===================== */
  function clearOn() { S.onEls.forEach(function (e) { e.classList.remove('on'); }); S.onEls = []; }
  function on(el) { if (el) { el.classList.add('on'); S.onEls.push(el); } }
  function keyLabel(c) { if (c === ' ') return t('space'); if (c === NL) return 'Enter'; return isLetter(c) ? c.toUpperCase() : c; }
  function badge(label, f) { return '<span class="kbadge f-' + f + '">' + esc(label) + '</span>'; }
  function fname(f) { return '<span class="fname f-' + f + '"><i></i>' + esc(t('fingers')[f]) + '</span>'; }
  function highlight() {
    clearOn();
    var hint = $('hint');
    if (S.done || !S.text) { hint.innerHTML = ''; return; }
    if (S.warn) { hint.innerHTML = '<span class="warn">' + esc(S.warn) + '</span>'; }
    var exp = S.text.charAt(S.at);
    var info = S.keyMap[exp];
    var shF = null;
    if (info) {
      on(info.el);
      var fingers = [info.f];
      if (info.shift) {
        var left = info.f.charAt(0) === 'l';
        on(left ? S.shiftR : S.shiftL);
        shF = left ? 'rp' : 'lp';
        fingers.push(shF);
      }
      for (var k = 0; k < S.fingerEls.length; k++) {
        if (fingers.indexOf(S.fingerEls[k].getAttribute('data-f')) >= 0) on(S.fingerEls[k]);
      }
    }
    if (S.warn) return;
    var html = '';
    if (S.caps && isLetter(exp)) html += '<span class="warn">' + esc(t('caps')) + '</span>';
    if (isTouch && !S.started) { hint.innerHTML = html + '<span class="hint-pre">' + esc(t('tap')) + '</span>'; return; }
    if (!S.started) html += '<span class="hint-pre">' + esc(t('startPre')) + '</span>';
    if (!info) html += esc(t('press')) + ' ' + badge(keyLabel(exp), 'th');
    else if (shF) html += esc(t('hold')) + ' ' + badge('Shift', shF) + fname(shF) + ' ' + esc(t('and')) + ' ' + badge(keyLabel(exp), info.f) + fname(info.f);
    else html += esc(t('press')) + ' ' + badge(keyLabel(exp), info.f) + fname(info.f);
    if (!S.started) html += '<span class="hint-post">' + esc(t('startPost')) + '</span>';
    hint.innerHTML = html;
  }

  /* ===================== ТЕКСТ НА ЭКРАНЕ ===================== */
  function renderText() {
    var html = '';
    for (var k = 0; k < S.text.length; k++) {
      var c = S.text.charAt(k);
      if (c === NL) html += '<span class="ch nl">↵</span>' + NL;
      else if (c === ' ') html += '<span class="ch sp"> </span>';
      else html += '<span class="ch">' + esc(c) + '</span>';
    }
    $('line').hidden = S.block;
    $('block').hidden = !S.block;
    $('track').innerHTML = S.block ? '' : html;
    $('block').innerHTML = S.block ? html : '';
    S.spans = (S.block ? $('block') : $('track')).querySelectorAll('.ch');
    if (S.block) {
      $('block').scrollTop = 0;
    } else {
      var tr = $('track');
      tr.style.transition = 'none';
      positionTicker();
      void tr.offsetWidth;
      tr.style.transition = '';
    }
  }
  function positionTicker() {
    if (S.block || !S.spans.length) return;
    var idx = Math.min(S.at, S.spans.length - 1), sp = S.spans[idx];
    var x = sp.offsetLeft + (S.at >= S.spans.length ? sp.offsetWidth : 0);
    $('track').style.transform = 'translate(' + Math.round($('line').clientWidth * 0.36 - x) + 'px,-50%)';
  }
  function setCur() {
    var sp = S.spans[S.at];
    if (!sp) return;
    if (S.curEl) S.curEl.classList.remove('cur', 'bad');
    sp.classList.add('cur');
    S.curEl = sp;
    if (S.block) {
      var b = $('block'), top = sp.offsetTop;
      if (top < b.scrollTop + 8 || top > b.scrollTop + b.clientHeight - 48) b.scrollTop = Math.max(0, top - 60);
    } else {
      positionTicker();
    }
  }
  function doneAt(p) {
    var sp = S.spans[p];
    if (!sp) return;
    sp.classList.remove('cur', 'bad');
    sp.classList.add('done');
    if (S.wrong[p]) sp.classList.add('err');
  }

  /* ===================== ПЕЧАТЬ ===================== */
  function setupText(text, block, layout) {
    clearInterval(S.timer);
    S.timer = null;
    document.body.classList.remove('focusing');
    $('board').classList.remove('typing');
    S.text = text; S.block = block; S.at = 0; S.correct = 0; S.errors = 0; S.errMap = {}; S.wrong = {};
    S.started = false; S.done = false; S.warn = ''; S.curEl = null;
    if (layout !== S.layout) { S.layout = layout; buildKeyboard(); buildHands(); }
    renderText();
    setCur();
    updateStats();
    highlight();
  }
  function loadLesson(mode, lv, i) {
    var C = COURSES[mode];
    lv = Math.max(0, Math.min(lv | 0, C.length - 1));
    i = Math.max(0, Math.min(i | 0, C[lv].l.length - 1));
    S.mode = mode; S.lv = lv; S.i = i; S.special = null;
    S.saved[mode] = { lv: lv, i: i };
    S.saved.m = mode;
    store.set('pt_pos', S.saved);
    var r = makeText(mode, lv, i);
    setupText(r.text, r.block, layoutOf(mode));
    renderPicker();
    renderTitle();
    renderStats();
  }
  // тест скорости: 1 минута случайных частых слов
  function startTest(lang) {
    var pool = WORDS[lang].filter(function (w) { return w.length >= 2 && w.length <= 8 && w === w.toLowerCase(); });
    var gen = function () { return wordsText(pool, 220); };
    S.mode = lang;
    S.saved.test = lang;
    store.set('pt_pos', S.saved);
    S.special = { kind: 'test', gen: gen, block: false, layout: layoutOf(lang) };
    S.special.text = gen();
    setupText(S.special.text, false, S.special.layout);
    renderPicker();
    renderTitle();
    renderStats();
  }
  function restart() {
    if (S.special) {
      if (S.special.gen) S.special.text = S.special.gen();
      setupText(S.special.text, S.special.block, S.special.layout);
    } else {
      loadLesson(S.mode, S.lv, S.i);
    }
  }
  function startTyping() {
    S.started = true;
    S.t0 = Date.now();
    S.timer = setInterval(updateStats, 250);
    $('board').classList.add('typing');
    ensureVisible();
  }
  function typeChar(ch) {
    if (S.done || !S.text || S.modal) return;
    var exp = S.text.charAt(S.at);
    var ok = ch === exp || (exp === 'ё' && ch === 'е') || (exp === 'Ё' && ch === 'Е') || (exp === 'е' && ch === 'ё') || (exp === 'Е' && ch === 'Ё');
    // включена не та раскладка — подсказываем и не считаем ошибкой
    if (!ok && isLetter(exp) && isLetter(ch) && ((isCyr(exp) && isLat(ch)) || (isLat(exp) && isCyr(ch)))) {
      S.warn = t(isCyr(exp) ? 'toRu' : 'toEn');
      shake();
      highlight();
      return;
    }
    // казахская буква, а нажата цифра или знак — включена русская раскладка
    if (!ok && isKz(exp) && !isLetter(ch)) {
      S.warn = t('toKz');
      shake();
      highlight();
      return;
    }
    // включен Caps Lock — тоже не считаем ошибкой
    if (!ok && S.caps && isLetter(exp) && ch.toLowerCase() === exp.toLowerCase()) {
      shake();
      highlight();
      return;
    }
    if (!S.started) startTyping();
    if (S.focus && !document.body.classList.contains('focusing')) { document.body.classList.add('focusing'); S.mouse = 0; }
    S.warn = '';
    flash(ch, ok);
    if (ok) {
      S.correct++;
      doneAt(S.at);
      S.at++;
      if (exp === NL) { while (S.text.charAt(S.at) === ' ') { doneAt(S.at); S.at++; } }  // отступ в коде ставится сам
      if (S.at >= S.text.length) { finish(); return; }
      setCur();
    } else {
      S.errors++;
      S.errMap[exp] = (S.errMap[exp] || 0) + 1;
      S.wrong[S.at] = 1;
      if (S.spans[S.at]) S.spans[S.at].classList.add('bad');
      if (S.sound) beep();
      shake();
    }
    updateStats();
    highlight();
  }
  function flash(ch, ok) {
    var info = S.keyMap[ch];
    if (!info) return;
    var el = info.el, cls = ok ? 'hit' : 'miss';
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    setTimeout(function () { el.classList.remove(cls); }, 170);
  }
  function shake() {
    var b = $('board');
    b.classList.remove('shake');
    void b.offsetWidth;
    b.classList.add('shake');
  }
  var audio = null;
  function beep() {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      var o = audio.createOscillator(), g = audio.createGain(), n = audio.currentTime;
      o.type = 'square';
      o.frequency.value = 190;
      g.gain.setValueAtTime(0.0001, n);
      g.gain.exponentialRampToValueAtTime(0.07, n + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, n + 0.12);
      o.connect(g);
      g.connect(audio.destination);
      o.start(n);
      o.stop(n + 0.13);
    } catch (e) {}
  }
  function fmtTime(ms) { var s = Math.floor(ms / 1000); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
  function speedText(cpm) { return S.ui === 'en' ? Math.round(cpm / 5) : cpm; }
  function updateStats() {
    var ms = S.started ? ((S.done ? S.tEnd : Date.now()) - S.t0) : 0;
    var isTest = S.special && S.special.kind === 'test';
    if (isTest && S.started && !S.done && ms >= TEST_MS) { finish(); return; }
    var cpm = (S.started && ms > 1000 && S.correct > 1) ? Math.round(S.correct / ms * 60000) : 0;
    var tot = S.correct + S.errors;
    $('sSpeed').textContent = speedText(cpm);
    $('lSpeed').textContent = t('speed');
    $('sAcc').textContent = (tot ? Math.floor(S.correct / tot * 100) : 100) + '%';
    $('sErr').textContent = S.errors;
    $('sTime').textContent = isTest ? fmtTime(Math.max(0, TEST_MS - ms)) : fmtTime(ms);
    $('progressBar').style.width = (S.text.length ? S.at / S.text.length * 100 : 0) + '%';
  }
  function ensureVisible() {
    var target = S.kb ? $('handsWrap') : $('board');
    var r = target.getBoundingClientRect();
    if (r.bottom > window.innerHeight) {
      var need = r.bottom - window.innerHeight + 16;
      var maxUp = $('board').getBoundingClientRect().top - 12;
      var dy = Math.min(need, maxUp);
      if (dy > 0) window.scrollBy({ top: dy, behavior: 'smooth' });
    }
  }

  /* ===================== КОНЕЦ УРОКА ===================== */
  function statBucket() {
    if (!S.special) return S.mode;
    if (S.special.kind === 'test') return 'test-' + S.special.layout;
    if (S.special.layout === 'ru' || S.special.layout === 'kz') return S.special.layout;
    return S.mode === 'code' ? 'code' : 'en';
  }
  function finish(early) {
    early = early === true;
    S.done = true;
    S.tEnd = Date.now();
    clearInterval(S.timer);
    S.timer = null;
    document.body.classList.remove('focusing');
    $('board').classList.remove('typing');
    if (S.curEl) S.curEl.classList.remove('cur', 'bad');
    updateStats();
    positionTicker();
    highlight();
    var ms = Math.max(1, S.tEnd - S.t0);
    var isTest = S.special && S.special.kind === 'test';
    if (isTest && !early) ms = Math.min(ms, TEST_MS);
    var cpm = Math.round(S.correct / ms * 60000);
    var acc = S.correct / Math.max(1, S.correct + S.errors);
    var stars = acc >= 0.98 ? 3 : (acc >= 0.93 ? 2 : 1);
    if (!S.special && !early) {
      var key = S.mode + '-' + S.lv + '-' + S.i, p = S.prog[key] || { s: 0, c: 0 };
      p.s = Math.max(p.s, stars);
      p.c = Math.max(p.c, cpm);
      S.prog[key] = p;
      store.set('pt_prog', S.prog);
    }
    var b = statBucket(), st = S.stats[b] || (S.stats[b] = { e: {}, k: 0, ms: 0, best: 0 });
    Object.keys(S.errMap).forEach(function (c) { st.e[c] = (st.e[c] || 0) + S.errMap[c]; });
    st.k += S.correct;
    st.ms += ms;
    if (!early && S.correct >= 20) st.best = Math.max(st.best, cpm);   // рекорд — только за пройденный до конца урок
    store.set('pt_stats', S.stats);
    renderPicker();
    renderStats();
    var html = '';
    for (var k = 0; k < 3; k++) html += '<i' + (k < stars ? ' class="f"' : '') + '>★</i>';
    $('resStars').innerHTML = early ? '' : html;
    $('resTitle').textContent = early ? t('resStop') : (isTest ? t('testDone') : t('res' + stars));
    $('rSpeed').textContent = speedText(cpm);
    $('rSpeedL').textContent = t('speed');
    $('rSpeedSub').textContent = S.ui === 'en' ? (cpm + ' ' + t('cpmShort')) : ('≈ ' + Math.round(cpm / 5) + ' ' + t('wpmNote'));
    if (isTest) {
      var bests = store.get('pt_test_best', {}), lk = S.special.layout;
      if (!early && cpm > (bests[lk] || 0)) { bests[lk] = cpm; store.set('pt_test_best', bests); }
      if (bests[lk]) $('rSpeedSub').textContent += ' · ' + t('testBest') + ': ' + speedText(bests[lk]);
    }
    $('rAcc').textContent = (Math.floor(acc * 1000) / 10) + '%';
    $('rErr').textContent = S.errors;
    $('rTime').textContent = fmtTime(ms);
    renderChart($('resChart'), S.errMap, 6, S.layout);
    openModal('res');
  }
  function goNext() {
    closeModal();
    if (S.special && S.special.kind === 'test') { restart(); return; }
    if (S.special) { loadLesson(S.mode, S.lv, S.i); return; }
    var C = COURSES[S.mode], lv = S.lv, i = S.i + 1;
    if (i >= C[lv].l.length) {
      if (lv + 1 < C.length) { lv++; i = 0; } else { i = S.i; }
    }
    loadLesson(S.mode, lv, i);
  }
  function again() { closeModal(); restart(); }
  function openModal(name) {
    S.modal = name;
    var m = $(name + 'Modal');
    m.hidden = false;
    var f = m.querySelector('[data-autofocus]');
    if (f) setTimeout(function () { f.focus(); }, 30);
  }
  function closeModal() {
    if (!S.modal) return;
    $(S.modal + 'Modal').hidden = true;
    S.modal = null;
  }

  /* ===================== ВЫБОР УРОКА И ЗАГОЛОВОК ===================== */
  function starsHtml(n) { var s = ''; for (var q = 0; q < 3; q++) s += '<i' + (q < n ? ' class="f"' : '') + '>★</i>'; return s; }
  function renderPicker() {
    var mb = document.querySelectorAll('.mode');
    for (var k = 0; k < mb.length; k++) mb[k].classList.toggle('on', mb[k].getAttribute('data-mode') === S.mode);
    var C = COURSES[S.mode], html = '', lv, j;
    for (lv = 0; lv < C.length; lv++) {
      var done = 0;
      for (j = 0; j < C[lv].l.length; j++) if (S.prog[S.mode + '-' + lv + '-' + j]) done++;
      html += '<button class="lvl' + (lv === S.lv ? ' on' : '') + '" type="button" data-lv="' + lv + '"><b>' + (lv + 1) + '</b>' +
        esc(C[lv].n[S.ui]) + '<small>' + done + '/' + C[lv].l.length + '</small></button>';
    }
    $('levels').innerHTML = html;
    keepVisible($('levels'));
    html = '';
    var L = C[S.lv].l;
    for (j = 0; j < L.length; j++) {
      var p = S.prog[S.mode + '-' + S.lv + '-' + j];
      html += '<button class="les' + (j === S.i && !S.special ? ' on' : '') + '" type="button" data-n="' + j + '"><span class="les-n">' + (j + 1) + '</span>' +
        '<span class="les-t">' + esc(lessonTitle(S.mode, S.lv, j)) + '</span><span class="les-s">' + starsHtml(p ? p.s : 0) + '</span></button>';
    }
    $('lessons').innerHTML = html;
    keepVisible($('lessons'));
    renderGo();
  }
  // строка «Урок 3 из 7» и текст большой кнопки
  function renderGo() {
    var C = COURSES[S.mode], L = C[S.lv].l;
    if (S.special && S.special.kind === 'test') {
      $('pickMain').textContent = t('testTitle') + ' · ' + t('testSub');
      $('pickSub').textContent = t('testPick');
      $('goText').textContent = t('testGo');
      return;
    }
    if (S.special) {
      $('pickMain').textContent = t('special');
      $('pickSub').textContent = t('pickHint');
    } else {
      $('pickMain').textContent = t('lessonWord') + ' ' + (S.i + 1) + ' ' + t('of') + ' ' + L.length + ' · ' + lessonTitle(S.mode, S.lv, S.i);
      $('pickSub').textContent = t('level') + ' ' + (S.lv + 1) + ': ' + C[S.lv].n[S.ui];
    }
    $('goText').textContent = Object.keys(S.prog).length ? t('goContinue') : t('goStart');
  }
  function setPanel(open) {
    $('pickPanel').hidden = !open;
    $('btnPick').setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) { keepVisible($('levels')); keepVisible($('lessons')); }
  }
  function goTyping() {
    setPanel(false);
    if (S.done) restart();
    $('trainer').scrollIntoView({ behavior: 'smooth', block: 'start' });
    try { $('hiddenInput').focus({ preventScroll: true }); } catch (e) {}
  }
  // на телефоне ряды прокручиваются вбок — показываем выбранный элемент
  function keepVisible(box) {
    var el = box.querySelector('.on');
    if (!el || box.scrollWidth <= box.clientWidth) return;
    if (el.offsetLeft < box.scrollLeft || el.offsetLeft + el.offsetWidth > box.scrollLeft + box.clientWidth) box.scrollLeft = el.offsetLeft - 16;
  }
  function renderTitle() {
    var top, main;
    if (S.special && S.special.kind === 'test') { top = t('testSub'); main = t('testTitle'); }
    else if (S.special) { top = t('special'); main = S.special.kind === 'trouble' ? t('troubleTitle') + ': ' + S.special.chars.map(charLabel).join(' ') : t('customTitle'); }
    else { top = t('level') + ' ' + (S.lv + 1) + ' · ' + COURSES[S.mode][S.lv].n[S.ui]; main = (S.i + 1) + '. ' + lessonTitle(S.mode, S.lv, S.i); }
    $('lessonTitle').innerHTML = '<small>' + esc(top) + '</small>' + esc(main);
  }

  /* ===================== СТАТИСТИКА И ДИАГРАММА ===================== */
  function charLabel(c) { return c === ' ' ? t('space') : (c === NL ? 'Enter' : c); }
  function renderChart(el, map, limit, layout) {
    var arr = Object.keys(map).filter(function (c) { return map[c] > 0; })
      .sort(function (a, b) { return map[b] - map[a]; }).slice(0, limit);
    if (!arr.length) { el.innerHTML = '<p class="empty">' + esc(t('noErr')) + '</p>'; return; }
    var max = map[arr[0]], html = '';
    arr.forEach(function (c) {
      var f = FINGER_OF[layout][c] || FINGER_OF[layout][c.toLowerCase()] || 'th';
      html += '<div class="bar-row f-' + f + '"><span class="bar-key">' + esc(charLabel(c)) + '</span>' +
        '<span class="bar"><i style="width:' + Math.max(8, Math.round(map[c] / max * 100)) + '%"></i></span><span class="bar-n">' + map[c] + '</span></div>';
    });
    el.innerHTML = html;
  }
  function renderStats() {
    var m = S.mode, st = S.stats[m] || { e: {}, k: 0, ms: 0, best: 0 }, total = 0, done = 0;
    COURSES[m].forEach(function (lv, a) { lv.l.forEach(function (x, b) { total++; if (S.prog[m + '-' + a + '-' + b]) done++; }); });
    $('statsMode').textContent = t({ ru: 'modeRu', en: 'modeEn', kz: 'modeKz' }[m] || 'modeCode');
    $('stDone').textContent = done + ' / ' + total;
    $('stBest').textContent = speedText(st.best) + ' ' + t('speed');
    $('stTyped').textContent = Number(st.k).toLocaleString(S.ui === 'en' ? 'en-US' : 'ru-RU');
    renderChart($('chartAll'), st.e, 10, layoutOf(m));
  }
  function showNote(msg) {
    var n = $('statsMsg');
    n.textContent = msg;
    n.hidden = false;
    clearTimeout(showNote.tm);
    showNote.tm = setTimeout(function () { n.hidden = true; }, 6000);
  }
  function startTrouble() {
    var st = S.stats[S.mode];
    var chars = st ? Object.keys(st.e).filter(function (c) { return c !== ' ' && c !== NL; })
      .sort(function (a, b) { return st.e[b] - st.e[a]; }).slice(0, 6) : [];
    if (!chars.length) { showNote(t('troubleEmpty')); return; }
    var set = chars.join(''), low = set.toLowerCase(), mode = S.mode;
    var gen = function () {
      var words = WORDS[mode].filter(function (w) { return hasAny(w, low) || hasAny(w, set); });
      var items = [];
      for (var n = 0; n < 20; n++) items.push(words.length && n % 2 ? pick(words) : group(set, set));
      return items.join(' ');
    };
    S.special = { kind: 'trouble', chars: chars, gen: gen, block: false, layout: layoutOf(mode) };
    S.special.text = gen();
    setupText(S.special.text, false, S.special.layout);
    renderPicker();
    renderTitle();
    $('trainer').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ===================== СВОЙ ТЕКСТ ===================== */
  function normalize(s) {
    var pairs = [['«', '"'], ['»', '"'], ['“', '"'], ['”', '"'], ['„', '"'], ['’', "'"], ['‘', "'"], ['—', '-'], ['–', '-'], ['…', '...'],
      [String.fromCharCode(160), ' '], [String.fromCharCode(9), '    '], [String.fromCharCode(13), '']];
    pairs.forEach(function (p) { s = s.split(p[0]).join(p[1]); });
    s = s.split(NL).map(function (l) { return l.replace(/ +$/, ''); }).join(NL);
    while (s.indexOf(NL + NL + NL) >= 0) s = s.split(NL + NL + NL).join(NL + NL);
    s = s.trim();
    if (s.indexOf(NL) < 0) s = s.replace(/ +/g, ' ');
    return s.slice(0, 3000);
  }
  function startCustom() {
    var txt = normalize($('customText').value);
    if (!txt) { $('customText').focus(); return; }
    store.set('pt_custom', txt);
    var layout = isCyr(txt) ? 'ru' : 'en';
    S.special = { kind: 'custom', text: txt, block: txt.indexOf(NL) >= 0, layout: layout };
    closeModal();
    setupText(txt, S.special.block, layout);
    renderPicker();
    renderTitle();
  }

  /* ===================== ЯЗЫК, ТЕМА, НАСТРОЙКИ ===================== */
  function applyI18n() {
    document.documentElement.lang = S.ui;
    document.title = (PAGE.title && PAGE.title[S.ui]) || t('title');
    var els = document.querySelectorAll('[data-i]'), k;
    for (k = 0; k < els.length; k++) els[k].textContent = t(els[k].getAttribute('data-i'));
    els = document.querySelectorAll('[data-ih]');
    for (k = 0; k < els.length; k++) els[k].innerHTML = t(els[k].getAttribute('data-ih'));
    els = document.querySelectorAll('[data-ph]');
    for (k = 0; k < els.length; k++) els[k].placeholder = t(els[k].getAttribute('data-ph'));
    els = document.querySelectorAll('[data-tip]');
    for (k = 0; k < els.length; k++) { els[k].title = t(els[k].getAttribute('data-tip')); els[k].setAttribute('aria-label', t(els[k].getAttribute('data-tip'))); }
    els = document.querySelectorAll('[data-ui]');
    for (k = 0; k < els.length; k++) els[k].classList.toggle('on', els[k].getAttribute('data-ui') === S.ui);
  }
  function applyToggles() {
    $('btnFocus').setAttribute('aria-pressed', S.focus ? 'true' : 'false');
    $('btnSound').setAttribute('aria-pressed', S.sound ? 'true' : 'false');
    $('btnKb').setAttribute('aria-pressed', S.kb ? 'true' : 'false');
    $('trainer').classList.toggle('no-kb', !S.kb);
  }

  /* ===================== СОБЫТИЯ ===================== */
  document.addEventListener('keydown', function (e) {
    if (e.getModifierState) {
      var caps = e.getModifierState('CapsLock');
      if (caps !== S.caps) { S.caps = caps; if (!S.modal) highlight(); }
    }
    if (!$('settingsMenu').hidden && e.key === 'Escape') { e.preventDefault(); setMenu(false); return; }
    if (S.modal === 'res') {
      if (e.key === 'Enter') { e.preventDefault(); goNext(); }
      else if (e.key === 'Escape') { e.preventDefault(); again(); }
      return;
    }
    if (S.modal === 'custom' || S.modal === 'feedback') {
      if (e.key === 'Escape') { e.preventDefault(); closeModal(); }
      return;
    }
    var tg = e.target;
    if (tg && tg !== $('hiddenInput') && (tg.tagName === 'TEXTAREA' || tg.tagName === 'INPUT' || tg.tagName === 'SELECT' || tg.isContentEditable)) return;
    if (e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;
    // Esc во время урока — сразу закончить и показать статистику
    if (e.key === 'Escape') { e.preventDefault(); if (S.started && !S.done) finish(true); return; }
    var ch = e.key === 'Enter' ? NL : ((e.key && e.key.length === 1) ? e.key : null);
    if (ch === null) return;
    e.preventDefault();
    typeChar(ch);
  });
  $('hiddenInput').addEventListener('input', function () {
    var v = this.value;
    this.value = '';
    for (var k = 0; k < v.length; k++) { var c = v.charAt(k); typeChar(c === String.fromCharCode(13) ? NL : c); }
  });
  $('board').addEventListener('click', function () { try { $('hiddenInput').focus({ preventScroll: true }); } catch (e) {} });
  // режим фокуса выключается, если подвигать мышью или нажать мышью
  var lastX = null, lastY = null;
  document.addEventListener('mousemove', function (e) {
    if (lastX !== null) S.mouse += Math.abs(e.clientX - lastX) + Math.abs(e.clientY - lastY);
    lastX = e.clientX;
    lastY = e.clientY;
    if (S.mouse > 60) document.body.classList.remove('focusing');
  });
  document.addEventListener('mousedown', function () { document.body.classList.remove('focusing'); });
  window.addEventListener('resize', positionTicker);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(positionTicker);

  document.querySelector('.modes').addEventListener('click', function (e) {
    var b = e.target.closest('.mode');
    if (!b) return;
    var m = b.getAttribute('data-mode'), p = S.saved[m] || { lv: 0, i: 0 };
    if (PAGE.kind === 'test') startTest(m);
    else loadLesson(m, p.lv, p.i);
    b.blur();
  });
  $('levels').addEventListener('click', function (e) {
    var b = e.target.closest('.lvl');
    if (!b) return;
    loadLesson(S.mode, +b.getAttribute('data-lv'), 0);
    b.blur();
  });
  $('lessons').addEventListener('click', function (e) {
    var b = e.target.closest('.les');
    if (!b) return;
    loadLesson(S.mode, S.lv, +b.getAttribute('data-n'));
    b.blur();
    setPanel(false);
  });
  $('btnPick').addEventListener('click', function () { setPanel($('pickPanel').hidden); this.blur(); });
  $('btnGo').addEventListener('click', function () { this.blur(); goTyping(); });
  $('btnRestart').addEventListener('click', function () { restart(); this.blur(); });
  $('btnCustom').addEventListener('click', function () {
    this.blur();
    var last = store.get('pt_custom', '');
    if (last && !$('customText').value) $('customText').value = last;
    openModal('custom');
  });
  $('btnCustomGo').addEventListener('click', startCustom);
  $('btnCustomCancel').addEventListener('click', closeModal);
  $('customModal').addEventListener('click', function (e) { if (e.target === this) closeModal(); });
  $('btnNext').addEventListener('click', goNext);
  $('btnAgain').addEventListener('click', again);
  $('resModal').addEventListener('click', function (e) { if (e.target === this) again(); });
  $('btnKb').addEventListener('click', function () { S.kb = !S.kb; store.set('pt_kb', S.kb); applyToggles(); this.blur(); });
  $('btnFocus').addEventListener('click', function () { S.focus = !S.focus; store.set('pt_focus', S.focus); applyToggles(); this.blur(); });
  $('btnSound').addEventListener('click', function () { S.sound = !S.sound; store.set('pt_sound', S.sound); applyToggles(); if (S.sound) beep(); this.blur(); });
  $('btnTheme').addEventListener('click', function () {
    var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('pt_theme', next); } catch (e) {}
    this.blur();
  });
  // меню настроек ⚙
  function setMenu(open) {
    $('settingsMenu').hidden = !open;
    $('btnSettings').setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  $('btnSettings').addEventListener('click', function (e) { e.stopPropagation(); setMenu($('settingsMenu').hidden); this.blur(); });
  document.addEventListener('click', function (e) {
    if (!$('settingsMenu').hidden && !e.target.closest('.settings')) setMenu(false);
  });
  function setUi(ui) {
    if (ui === S.ui) return;
    S.ui = ui;
    store.set('pt_ui', S.ui);
    applyI18n();
    buildKeyboard();
    buildHands();
    renderPicker();
    renderTitle();
    renderStats();
    updateStats();
    highlight();
    renderVotes();
  }
  document.querySelector('.seg').addEventListener('click', function (e) {
    var b = e.target.closest('[data-ui]');
    if (b) { setUi(b.getAttribute('data-ui')); b.blur(); }
  });

  /* ===================== ОЦЕНКА САЙТА: ЛАЙКИ И ДИЗЛАЙКИ =====================
     Счетчики общие для всех посетителей — хранятся в бесплатном сервисе Abacus.
     Голосовать можно один раз с одного браузера. */
  var VOTE_API = 'https://abacus.jasoncameron.dev/';
  var VOTE_NS = 'practicetap-com';
  var VOTE_KEY = { like: 'site-like', dislike: 'site-dislike' };
  var votes = { like: null, dislike: null }, myVote = store.get('pt_vote', ''), voteMsg = '';
  function renderVotes() {
    $('cntLike').textContent = votes.like === null ? '…' : votes.like;
    $('cntDislike').textContent = votes.dislike === null ? '…' : votes.dislike;
    $('btnLike').classList.toggle('on', myVote === 'like');
    $('btnDislike').classList.toggle('on', myVote === 'dislike');
    $('votes').classList.toggle('voted', !!myVote);
    $('btnLike').setAttribute('aria-pressed', myVote === 'like' ? 'true' : 'false');
    $('btnDislike').setAttribute('aria-pressed', myVote === 'dislike' ? 'true' : 'false');
    var m = voteMsg || (myVote ? t('voteThanks') : '');
    $('voteMsg').textContent = m;
    $('voteMsg').hidden = !m;
  }
  function readCount(v) {
    return fetch(VOTE_API + 'get/' + VOTE_NS + '/' + VOTE_KEY[v])
      .then(function (r) { if (r.status === 404) return { value: 0 }; if (!r.ok) throw new Error('http'); return r.json(); })
      .then(function (d) { votes[v] = d.value | 0; })
      .catch(function () { votes[v] = null; });
  }
  function loadVotes() {
    Promise.all([readCount('like'), readCount('dislike')]).then(renderVotes);
  }
  function sendVote(v) {
    if (myVote) return;
    myVote = v;
    voteMsg = '';
    if (votes[v] !== null) votes[v]++;
    renderVotes();
    fetch(VOTE_API + 'hit/' + VOTE_NS + '/' + VOTE_KEY[v])
      .then(function (r) { if (!r.ok) throw new Error('http'); return r.json(); })
      .then(function (d) { votes[v] = d.value | 0; store.set('pt_vote', v); renderVotes(); })
      .catch(function () {
        myVote = '';
        if (votes[v] !== null) votes[v]--;
        voteMsg = t('voteErr');
        renderVotes();
      });
  }
  $('btnLike').addEventListener('click', function () { this.blur(); sendVote('like'); });
  $('btnDislike').addEventListener('click', function () { this.blur(); sendVote('dislike'); });
  function setFbHidden(hide) {
    store.set('pt_fb_hidden', hide);
    $('fbCard').hidden = hide;
    $('rateWrap').hidden = !hide;
    if (!hide && votes.like === null) loadVotes();
  }
  $('btnFbHide').addEventListener('click', function () { setFbHidden(true); });
  $('btnShowFb').addEventListener('click', function () {
    setFbHidden(false);
    $('fbCard').scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  $('btnTrouble').addEventListener('click', function () { this.blur(); startTrouble(); });
  // предложения разработчику: открываем почту с готовым письмом
  $('btnFeedback').addEventListener('click', function () { this.blur(); openModal('feedback'); });
  $('btnFbCancel').addEventListener('click', closeModal);
  $('feedbackModal').addEventListener('click', function (e) { if (e.target === this) closeModal(); });
  $('btnFbSend').addEventListener('click', function () {
    var msg = $('fbText').value.trim();
    if (!msg) { $('fbText').focus(); return; }
    window.location.href = 'mailto:dester1310@gmail.com?subject=' + encodeURIComponent(t('fbSubject')) + '&body=' + encodeURIComponent(msg);
    $('fbText').value = '';
    closeModal();
  });
  $('btnReset').addEventListener('click', function () {
    var b = this;
    if (!b.classList.contains('sure')) {
      b.classList.add('sure');
      b.textContent = t('resetSure');
      clearTimeout(b.tm);
      b.tm = setTimeout(function () { b.classList.remove('sure'); b.textContent = t('reset'); }, 3500);
      return;
    }
    clearTimeout(b.tm);
    delete S.stats[S.mode];
    store.set('pt_stats', S.stats);
    b.classList.remove('sure');
    b.textContent = t('reset');
    renderStats();
  });

  /* ===================== ЗАПУСК ===================== */
  $('year').textContent = new Date().getFullYear();
  applyI18n();
  applyToggles();
  if (PAGE.kind === 'test') {
    $('btnPick').hidden = true;
    startTest(S.saved.test === 'en' ? 'en' : 'ru');
  } else {
    var startMode = PAGE.kind === 'kz' ? 'kz' : (COURSES[S.saved.m] && S.saved.m !== 'kz' ? S.saved.m : 'ru');
    var startPos = S.saved[startMode] || { lv: 0, i: 0 };
    loadLesson(startMode, startPos.lv, startPos.i);
  }
  renderVotes();
  setFbHidden(store.get('pt_fb_hidden', false) === true);
})();

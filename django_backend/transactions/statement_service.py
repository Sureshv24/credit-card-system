from decimal import Decimal

from django.conf import settings
from django.utils import timezone

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from cards.models import Card
from .models import Transaction


def generate_monthly_statement(user, year, month):
    """
    Generate a PDF monthly credit-card statement
    for the authenticated user.
    """

    transactions = (
        Transaction.objects
        .filter(
            user_id=user.id,
            created_at__year=year,
            created_at__month=month,
        )
        .order_by("created_at")
    )

    # --------------------------------------------------------
    # CARD LOOKUP
    # --------------------------------------------------------

    card_ids = {
        transaction.card_id
        for transaction in transactions
    }

    cards = {
        card.id: card
        for card in Card.objects.filter(
            user_id=user.id,
            id__in=card_ids,
        )
    }

    # --------------------------------------------------------
    # TOTAL SPENDING
    # --------------------------------------------------------

    total_spending = sum(
        (
            transaction.amount
            for transaction in transactions
            if transaction.status == "SUCCESS"
        ),
        Decimal("0.00"),
    )

    successful_count = sum(
        1
        for transaction in transactions
        if transaction.status == "SUCCESS"
    )

    pending_count = sum(
        1
        for transaction in transactions
        if transaction.status == "PENDING"
    )

    failed_count = sum(
        1
        for transaction in transactions
        if transaction.status == "FAILED"
    )

    # --------------------------------------------------------
    # PDF RESPONSE BUFFER
    # --------------------------------------------------------

    from io import BytesIO

    buffer = BytesIO()

    filename = (
        f"monthly_statement_{year}_{month:02d}.pdf"
    )

    document = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=15 * mm,
        leftMargin=15 * mm,
        topMargin=15 * mm,
        bottomMargin=15 * mm,
        title="CardPay Monthly Statement",
        author="CardPay Payment Platform",
    )

    # --------------------------------------------------------
    # STYLES
    # --------------------------------------------------------

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "StatementTitle",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#0f172a"),
        alignment=TA_LEFT,
        spaceAfter=6,
    )

    subtitle_style = ParagraphStyle(
        "StatementSubtitle",
        parent=styles["Normal"],
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#64748b"),
        alignment=TA_LEFT,
    )

    section_style = ParagraphStyle(
        "SectionTitle",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=14,
        textColor=colors.HexColor("#0f172a"),
        spaceBefore=8,
        spaceAfter=8,
    )

    normal_style = ParagraphStyle(
        "NormalText",
        parent=styles["Normal"],
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#334155"),
    )

    right_style = ParagraphStyle(
        "RightText",
        parent=normal_style,
        alignment=TA_RIGHT,
    )

    center_style = ParagraphStyle(
        "CenterText",
        parent=normal_style,
        alignment=TA_CENTER,
    )

    # --------------------------------------------------------
    # DOCUMENT CONTENT
    # --------------------------------------------------------

    story = []

    # --------------------------------------------------------
    # HEADER
    # --------------------------------------------------------

    header_data = [
        [
            Paragraph(
                "CardPay",
                ParagraphStyle(
                    "Brand",
                    parent=title_style,
                    textColor=colors.HexColor("#0891b2"),
                    fontSize=22,
                ),
            ),
            Paragraph(
                "MONTHLY CREDIT CARD STATEMENT",
                ParagraphStyle(
                    "StatementHeading",
                    parent=title_style,
                    fontSize=13,
                    alignment=TA_RIGHT,
                ),
            ),
        ]
    ]

    header_table = Table(
        header_data,
        colWidths=[
            80 * mm,
            95 * mm,
        ],
    )

    header_table.setStyle(
        TableStyle(
            [
                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "TOP",
                ),
                (
                    "ALIGN",
                    (1, 0),
                    (1, 0),
                    "RIGHT",
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    4,
                ),
            ]
        )
    )

    story.append(header_table)

    story.append(
        Paragraph(
            f"Statement Period: {year}-{month:02d}",
            subtitle_style,
        )
    )

    story.append(Spacer(1, 8))

    # --------------------------------------------------------
    # USER DETAILS
    # --------------------------------------------------------

    user_details = [
        [
            Paragraph("<b>Customer</b>", normal_style),
            Paragraph(
                user.get_full_name()
                or user.username,
                normal_style,
            ),
        ],
        [
            Paragraph("<b>Email</b>", normal_style),
            Paragraph(
                user.email or "-",
                normal_style,
            ),
        ],
        [
            Paragraph("<b>Statement Date</b>", normal_style),
            Paragraph(
                timezone.localdate().strftime(
                    "%d-%m-%Y"
                ),
                normal_style,
            ),
        ],
    ]

    user_table = Table(
        user_details,
        colWidths=[
            45 * mm,
            130 * mm,
        ],
    )

    user_table.setStyle(
        TableStyle(
            [
                (
                    "BACKGROUND",
                    (0, 0),
                    (0, -1),
                    colors.HexColor("#f1f5f9"),
                ),
                (
                    "BOX",
                    (0, 0),
                    (-1, -1),
                    0.5,
                    colors.HexColor("#cbd5e1"),
                ),
                (
                    "INNERGRID",
                    (0, 0),
                    (-1, -1),
                    0.25,
                    colors.HexColor("#e2e8f0"),
                ),
                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "MIDDLE",
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    6,
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    6,
                ),
            ]
        )
    )

    story.append(user_table)

    story.append(Spacer(1, 12))

    # --------------------------------------------------------
    # SUMMARY
    # --------------------------------------------------------

    story.append(
        Paragraph(
            "Statement Summary",
            section_style,
        )
    )

    summary_data = [
        [
            Paragraph(
                "<b>Total Transactions</b>",
                center_style,
            ),
            Paragraph(
                "<b>Successful</b>",
                center_style,
            ),
            Paragraph(
                "<b>Pending</b>",
                center_style,
            ),
            Paragraph(
                "<b>Failed</b>",
                center_style,
            ),
            Paragraph(
                "<b>Total Spending</b>",
                center_style,
            ),
        ],
        [
            Paragraph(
                str(transactions.count()),
                center_style,
            ),
            Paragraph(
                str(successful_count),
                center_style,
            ),
            Paragraph(
                str(pending_count),
                center_style,
            ),
            Paragraph(
                str(failed_count),
                center_style,
            ),
            Paragraph(
                f"₹{total_spending:,.2f}",
                ParagraphStyle(
                    "SummaryAmount",
                    parent=center_style,
                    fontName="Helvetica-Bold",
                    textColor=colors.HexColor("#0891b2"),
                ),
            ),
        ],
    ]

    summary_table = Table(
        summary_data,
        colWidths=[
            35 * mm,
            35 * mm,
            35 * mm,
            35 * mm,
            35 * mm,
        ],
    )

    summary_table.setStyle(
        TableStyle(
            [
                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, 0),
                    colors.HexColor("#0f172a"),
                ),
                (
                    "TEXTCOLOR",
                    (0, 0),
                    (-1, 0),
                    colors.white,
                ),
                (
                    "BACKGROUND",
                    (0, 1),
                    (-1, 1),
                    colors.HexColor("#f8fafc"),
                ),
                (
                    "BOX",
                    (0, 0),
                    (-1, -1),
                    0.5,
                    colors.HexColor("#cbd5e1"),
                ),
                (
                    "INNERGRID",
                    (0, 0),
                    (-1, -1),
                    0.25,
                    colors.HexColor("#e2e8f0"),
                ),
                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "MIDDLE",
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    7,
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    7,
                ),
            ]
        )
    )

    story.append(summary_table)

    story.append(Spacer(1, 12))

    # --------------------------------------------------------
    # CARD DETAILS
    # --------------------------------------------------------

    story.append(
        Paragraph(
            "Card Details",
            section_style,
        )
    )

    unique_card_ids = list(
        dict.fromkeys(
            transaction.card_id
            for transaction in transactions
        )
    )

    card_rows = [
        [
            Paragraph("<b>Card</b>", normal_style),
            Paragraph("<b>Type</b>", normal_style),
            Paragraph("<b>Valid Thru</b>", normal_style),
        ]
    ]

    for card_id in unique_card_ids:
        card = cards.get(card_id)

        if not card:
            continue

        card_rows.append(
            [
                Paragraph(
                    card.masked_card_number,
                    normal_style,
                ),
                Paragraph(
                    card.card_type.title(),
                    normal_style,
                ),
                Paragraph(
                    f"{card.expiry_month:02d}/{card.expiry_year}",
                    normal_style,
                ),
            ]
        )

    if len(card_rows) == 1:
        card_rows.append(
            [
                Paragraph(
                    "No card transactions for this period.",
                    normal_style,
                ),
                "",
                "",
            ]
        )

    card_table = Table(
        card_rows,
        colWidths=[
            75 * mm,
            45 * mm,
            45 * mm,
        ],
    )

    card_table.setStyle(
        TableStyle(
            [
                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, 0),
                    colors.HexColor("#e0f2fe"),
                ),
                (
                    "BOX",
                    (0, 0),
                    (-1, -1),
                    0.5,
                    colors.HexColor("#bae6fd"),
                ),
                (
                    "INNERGRID",
                    (0, 0),
                    (-1, -1),
                    0.25,
                    colors.HexColor("#e2e8f0"),
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    6,
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    6,
                ),
            ]
        )
    )

    story.append(card_table)

    story.append(Spacer(1, 12))

    # --------------------------------------------------------
    # TRANSACTION LIST
    # --------------------------------------------------------

    story.append(
        Paragraph(
            "Transaction Details",
            section_style,
        )
    )

    transaction_rows = [
        [
            Paragraph("<b>Date</b>", center_style),
            Paragraph("<b>Reference</b>", center_style),
            Paragraph("<b>Card</b>", center_style),
            Paragraph("<b>Status</b>", center_style),
            Paragraph("<b>Amount</b>", right_style),
        ]
    ]

    for transaction in transactions:
        card = cards.get(
            transaction.card_id
        )

        masked_card = (
            card.masked_card_number
            if card
            else "****"
        )

        status_color = (
            "#059669"
            if transaction.status == "SUCCESS"
            else "#d97706"
            if transaction.status == "PENDING"
            else "#dc2626"
        )

        transaction_rows.append(
            [
                Paragraph(
                    transaction.created_at.strftime(
                        "%d-%m-%Y"
                    ),
                    center_style,
                ),
                Paragraph(
                    transaction.transaction_reference,
                    normal_style,
                ),
                Paragraph(
                    masked_card,
                    center_style,
                ),
                Paragraph(
                    f'<font color="{status_color}"><b>{transaction.status}</b></font>',
                    center_style,
                ),
                Paragraph(
                    f"₹{transaction.amount:,.2f}",
                    right_style,
                ),
            ]
        )

    if len(transaction_rows) == 1:
        transaction_rows.append(
            [
                Paragraph(
                    "No transactions found for this month.",
                    normal_style,
                ),
                "",
                "",
                "",
                "",
            ]
        )

    transaction_table = Table(
        transaction_rows,
        colWidths=[
            28 * mm,
            52 * mm,
            32 * mm,
            27 * mm,
            36 * mm,
        ],
        repeatRows=1,
    )

    transaction_table.setStyle(
        TableStyle(
            [
                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, 0),
                    colors.HexColor("#0f172a"),
                ),
                (
                    "TEXTCOLOR",
                    (0, 0),
                    (-1, 0),
                    colors.white,
                ),
                (
                    "ROWBACKGROUNDS",
                    (0, 1),
                    (-1, -1),
                    [
                        colors.white,
                        colors.HexColor("#f8fafc"),
                    ],
                ),
                (
                    "BOX",
                    (0, 0),
                    (-1, -1),
                    0.5,
                    colors.HexColor("#cbd5e1"),
                ),
                (
                    "INNERGRID",
                    (0, 0),
                    (-1, -1),
                    0.25,
                    colors.HexColor("#e2e8f0"),
                ),
                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "MIDDLE",
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    6,
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    6,
                ),
            ]
        )
    )

    story.append(
        transaction_table
    )

    story.append(Spacer(1, 12))

    # --------------------------------------------------------
    # FOOTER INFORMATION
    # --------------------------------------------------------

    footer_data = [
        [
            Paragraph(
                "<b>Security Notice</b><br/>"
                "Full card numbers and CVV are not stored or displayed. "
                "Only masked card information is included in this statement.",
                normal_style,
            )
        ],
        [
            Paragraph(
                "CardPay Payment Platform",
                ParagraphStyle(
                    "Footer",
                    parent=normal_style,
                    alignment=TA_CENTER,
                    textColor=colors.HexColor(
                        "#64748b"
                    ),
                ),
            )
        ],
    ]

    footer_table = Table(
        footer_data,
        colWidths=[175 * mm],
    )

    footer_table.setStyle(
        TableStyle(
            [
                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, 0),
                    colors.HexColor("#f8fafc"),
                ),
                (
                    "BOX",
                    (0, 0),
                    (-1, -1),
                    0.5,
                    colors.HexColor("#cbd5e1"),
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    8,
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    8,
                ),
            ]
        )
    )

    story.append(Spacer(1, 8))
    story.append(footer_table)

    # --------------------------------------------------------
    # BUILD PDF
    # --------------------------------------------------------

    document.build(story)

    buffer.seek(0)

    return buffer, filename
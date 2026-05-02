import argparse
import json
import os
import sys
import pandas as pd

def _resolve_sheet_name(excel_file: str, sheet_name: str | None) -> str:
    """Resolve a sheet name robustly.

    - If sheet_name is None or 'first', return the workbook's first sheet.
    - Try exact match, then case-insensitive and trimmed match.
    - If not found, raise with a helpful error listing available sheets.
    """
    xls = pd.ExcelFile(excel_file)
    available = xls.sheet_names
    if not available:
        raise ValueError("No worksheets found in the Excel file.")

    if sheet_name is None or str(sheet_name).lower() == "first":
        return available[0]

    # Exact match first
    if sheet_name in available:
        return sheet_name

    # Case-insensitive, trimmed match
    target = sheet_name.strip().lower()
    for name in available:
        if name.strip().lower() == target:
            return name

    raise ValueError(
        f"Worksheet named '{sheet_name}' not found. Available: {', '.join(available)}"
    )


def excel_to_json_by_language(excel_file: str, sheet_name: str | None, output_path: str):
    # Resolve sheet name gracefully
    resolved_sheet = _resolve_sheet_name(excel_file, sheet_name)
    # Read Excel file into a pandas DataFrame
    df = pd.read_excel(excel_file, sheet_name=resolved_sheet)
    
    # Get the list of languages from the DataFrame columns (excluding the 'key' column)
    languages = df.columns[1:]  # Skip the first column 'key'
    
    # Iterate over each language
    for lang in languages:
        # Ensure lang is exactly two characters
        # lang = lang[:2]
        
        # Create a dictionary for the language
        lang_dict = {}
        
        # Iterate over rows and populate the dictionary
        for index, row in df.iterrows():
            # Check if lang exists in row, otherwise handle the KeyError
            try:
                lang_dict[row['key']] = row[lang]
            except KeyError as e:
                print(f"KeyError: {e} for language {lang} and key {row['key']}")
                lang_dict[row['key']] = f"MISSING_{lang}"  # Example of handling missing data
        
        # Generate JSON filename based on language
        json_file = os.path.join(output_path, f"{lang}.json")
        
        # Write JSON to a file with utf-8 encoding
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(lang_dict, f, indent=4, ensure_ascii=False)

def _list_sheets(excel_file: str):
    xls = pd.ExcelFile(excel_file)
    return xls.sheet_names


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Convert Excel translations to per-language JSON files.")
    parser.add_argument("--excel", required=False, default="../translation.xlsx", help="Path to the Excel file.")
    parser.add_argument("--sheet", required=False, default=None, help="Worksheet name to read (or 'first').")
    parser.add_argument("--out", required=False, default="../../common/i18n/locals", help="Output folder for JSON files.")
    parser.add_argument("--list-sheets", action="store_true", help="List available worksheets and exit.")

    args = parser.parse_args(argv)

    try:
        if args.list_sheets:
            sheets = _list_sheets(args.excel)
            print("Available worksheets:")
            for s in sheets:
                print(f"- {s}")
            return 0

        os.makedirs(args.out, exist_ok=True)
        excel_to_json_by_language(args.excel, args.sheet, args.out)
        print(f"JSON files written to: {args.out}")
        return 0
    except Exception as e:
        print(f"Error: {e}")
        return 1


if __name__ == '__main__':
    sys.exit(main())
